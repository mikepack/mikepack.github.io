---
title: "5 Early Lessons from Rapid, High Availability Scaling with Rails"
date: 2014-12-22
categories:
  - Archive
tags:
  - ruby
  - rails
  - heroku
  - scaling
  - postgresql
  - redis
  - performance
  - databases
  - caching
  - sharding
  - high-availability
  - infrastructure
  - lessons-learned
  - ello
  - optimization
---

At <a href="https://ello.co/" target="_blank">Ello</a>, we were blindsided by the amount of traffic we were receiving. Right time, right place, I guess. One week, we're seeing a few thousand daily sessions. The following week, a few million. This insurgence of users meant the software we built was contorted in directions we never thought possible.

Like anything viral, there's a massive influx of interest for a relatively short period of time, followed by a slow decline, leaving a wake of destruction as the subject settles into its new mold. Ello has since settled, so what better time than now to document some of the lessons learned whiling scaling during those critical weeks of virality. I want to ensure these lessons are not merely light takeaways but rather tangible advice that you can apply if you're ever fortunate/unfortunate enough to be put in a similar situation. As such, parts of this article will be specific to Ello and may not apply in other domains.

## Lesson 1: Move the graph

One of our first scaling hurdles involved managing the graph of relationships between users. We didn't just intuitively say, "oh, the graph is slow," but it didn't take much prodding either. We're on a standard Rails stack, using Heroku and Postgres. We have a table called `relationships` which stores all data about how users are tied together. Have you friended, blocked, or unfriended someone? It's all stored in the relationships table.

We're building a social network. By definition, our relationships table is one of the hottest tables we have. How many people are you following in total? How many in friends? How many in noise? Who should be notified when you create a post? All of these questions rely on the relationships table for answers. Answers to these questions will be cached by Postgres, so only the initial query incurs the cost of calculating the results. Subsequent queries are fast. But Postgres' query cache alone becomes meager at scale. As a user on a new social network, accumulating relationships is a regular activity. Every new relationships formed busts Postgres' cache for queries on that data. This was a high read, high write table.

Since we're on Heroku, we had the phenomenal <a href="https://devcenter.heroku.com/articles/heroku-postgresql#using-the-cli" target="_blank">Heroku Postgres</a> tools at our disposal. When thrown into the fire, one of the best extinguishers was `heroku pg:outliers`. This command illuminates the top 10 slowest queries. All 10 of ours were associated with the relationships table. We had all the right indexes in place, yet some queries were taking up to 10 seconds to produce results.

Resolving a problem like this is application specific, but in our case the best option was to denormalize the relationship data into a datastore that could more easily answer our pertinent and frequent questions about the social graph. We chose Redis. It was a bit of a knee-jerk reaction at the time but a technique we've had success with in the past. Only after having implemented this, did we stumble upon a reassuring article outlining how <a href="http://blog.pivotal.io/pivotal/case-studies-2/using-redis-at-pinterest-for-billions-of-relationships" target="_blank">Pinterest uses Redis for their graph</a>. To be clear, we didn't move the data entirely, we provided an additional layer of caching. All data is still stored in Postgres for durability and is cached in Redis for speed. In the event of a catastrophe, the Redis data can be rebuilt at any time.

We moved all of our hot queries against the relationships table into Redis. Since "followers" and "followings" are displayed on every profile and a `count(*)` was our top outlier, our first step was to cache these values in Redis counters. We used <a href="https://github.com/nateware/redis-objects" target="_blank">Redis Objects</a> to make this simple and elegant. Any time a new relationship was created or destroyed, these counters are incremented and decremented. When looking at another user's profile, to render the UI we needed to answer the question "are you following this user? If so, in the <a href="https://ello.co/wtf/post/friendsandnoise" target="_blank">friends or noise bucket</a>?" To answer this and similar questions, we cached the user IDs of all people who you had in your friends bucket, your noise bucket, and the union of both.

With our graph data in Redis, we can now query the graph in ways that would be prohibitively expensive with Postgres. In particular, we use it to influence our recommendation system. "Give me all the users that are being followed by people I'm following, but I'm not yet following." Using Redis set intersections, unions, and diffs, we can begin to derive new and interesting uses of the same data.

The real lesson here is this: every product has a core pillar that supports the core offering. Ello's is a social graph. When your core pillar begins to buckle under its own weight, it is critical to cache that data (or move it entirely) and continue providing your core offering.

## Lesson 2: Create indexes early, or you're screwed

No really, you'll be chasing down these indexes for months. The previous section outlined how we scaled our relationships table. This, and subsequent sections will detail how we scaled our `activities` table, or the denormalized table that runs everyone's main activity feed. The activity feed contains any posts that people you follow have created, notifications for when someone follows you, notifications for mentions, and the like. Everything that you need to be notified about ends up in this table and we forgot some indexes.

Prior to Ello, I fell into the camp that created indexes only when data proves so. Sure, you can predict usage patterns, but since indexes can consume a lot of memory, I would have rather created them when I knew they were necessary. Big mistake here.

The first type of index that we forgot was just a plain old btree on a field that was queried regularly. An index like this can be created easily if nobody is writing to the table or downtime is feasible. This is high availability scaling, so downtime is not an option, and everything was writing to this table. Since the activity table was experiencing extremely high writes, concurrently building these indexes would never finish. While an index is being built concurrently (that is, without downtime), new records in the table are also added to the index. If the speed by which new records are added outpaces the speed by which Postgres can index hundreds of millions of existing rows, you're shit out of luck.

The solution? If downtime is not an option, you'll have to build a chokepoint in your application. All writes to a particular table must be funneled through this chokepoint so that if you want to stop writes, you constrict the chokepoint. In our case, we are using <a href="https://github.com/mperham/sidekiq" target="_blank">Sidekiq</a>. We use Sidekiq jobs as our chokepoint, which means that if we ever want to stop all writes to the activities table, we spin down all Sidekiq workers for the queue that pertains to activity writes. Unworked jobs would get backed up and remain idle until we spun the workers back up, hence preventing writes to the activities table. Doing this for a couple minutes endowed Postgres with enough breathing room to work hard on building the index from existing records. Since Sidekiq jobs run asynchronously, this should have little impact on users. In our case, the worst that would happen is a user creates a post, refreshes the page, and sees that the post is not there because the activity record was not yet created. It's a tradeoff we made to keep the app highly available.

Situations like this are actually not the worst of it. The absolute worst is when you forget a unique index. Now your data is corrupt. We forgot a unique index, oops. When the level of concurrency necessary to run a rapidly scaling app reaches a point where you can't decipher whether a job is good or fallacious, you need to rely on your database's <a href="http://en.wikipedia.org/wiki/ACID" target="_blank">ACID</a> characteristics. This is why Postgres is awesome: something will happen once and only once regardless of concurrency. If two jobs try to accomplish the same thing in parallel, Postgres will ensure only one of them wins. Only if you have a unique index.

An astute reader might ask, "well, why would two jobs try to accomplish the same thing?" Let me quickly explain. It all stems from one bad piece of data, that when used, creates more bad data. For example, we didn't have a unique index on the relationships table. So, I could technically follow another user twice. When the user I follow creates a new post and it becomes time to ask, "who should receive this post in their feed?", if you're relying on the relationships table to answer that question, you're relying on bad data. The system will now create two duplicate activities. This is just one reason for duplicate jobs. Others include computers being stupid, computers failing, and computers trying to fix their own stupidity and failures. Fixing the source of the bad data, the non-unique relationships, was a great launching point towards stability.

So many of our scaling choices were derived from not having a unique index. It was crippling. Firstly, you can't create a unique index with non-unique values in the table. Just won't happen. You need to first remove duplicates, which is terrifying. You're deleting data, and you better hope you're caffeinated enough to do it correctly. I also recommend 48 hours of sleep before attempting. What constitutes a duplicate depends on the data, but this <a href="https://wiki.postgresql.org/wiki/Deleting_duplicates" target="_blank">Postgres wiki page on deleting duplicates</a> is an excellent resource for finding them.

So, you delete duplicates, great. What about the time between deleting duplicates and adding a unique index? If any duplicates were added in the meantime, the index won't build. So, you start from square one. Delete duplicates. Did the index build? No? Delete duplicates.

## Lesson 3: Sharding is cool, but not that cool

We sharded ourselves five times. Tee hee hee. Laugh it up. Sharding is so cool and webscale, we did it five times. I mentioned earlier that a lot of our scaling choices derived from the lack of a unique index. It took us two months to build a unique index on the activities table. At the point when the index was built, there were about a billion records in the table. Sharding would reduce the write traffic to each database and ease the pain of most tasks, including building a unique index.

For completeness, I want to define sharding. Like most things in software, sharding has conflated definitions, but here's mine. Sharding is the process of taking one large thing and breaking it into smaller pieces. We had one, large 750M record activities table that was becoming unwieldy. Prior to breaking down the activities table, we moved it out of our primary database (with users, posts, etc) into its own database, also a form of sharding. Moving it to a different database is horizontally sharding, breaking up a single table is vertically sharding or partitioning. We received recommendations from highly respected parties to think about vertically sharding when our table reached 100GB of data. We had about 200GB. We don't follow rules well.

I won't detail our sharding setup right now, but will mention that it took a lot of planning and practice to nail down. We used the <a href="https://github.com/tchandy/octopus" target="_blank">Octopus gem</a> to manage all of our ActiveRecord connection configurations, but that's certainly not the extent of it. Here are some articles you might find interesting: <a href="http://www.craigkerstiens.com/2012/11/30/sharding-your-database/" target="_blank">a general guide with diagrams</a>, <a href="https://www.braintreepayments.com/braintrust/scaling-postgresql-at-braintree-four-years-of-evolution" target="_blank">Braintree on MySQL</a>, and <a href="http://instagram-engineering.tumblr.com/post/10853187575/sharding-ids-at-instagram" target="_blank">Instagram on Postgres</a>.

When sharding, say we have database A that is progressively slowing and needs to be broken down. Before sharding, users with IDs modulus 0 and 1 have their data in database A. After sharding, we want to make users with IDs modulus 0 continue going to database A and modulus 1 go to a new database B. That way, we can spread the load between multiple databases and they will each grow at roughly half the speed. The general sharding process is this: setup a new replica/follower database B, stop all writes to A, sever the replica (A and B are now two exact duplicate dbs), update the shard configuration so some data goes to A and some to B, resume writes, prune antiquated data from both A and B.

So cool, I love sharding.

Many highly respected and extremely expensive people told us we needed to shard. We trusted them. We planned out multiple approaches to sharding and converged on the technique outlined here, sharding by user ID. What nobody cared to consider was what would happen after we've sharded. We thought there was a pot of gold. Nope.

We sharded for two reasons: so we didn't hit a ceiling while vertically scaling our Postgres boxes. And so our queries would perform better because we had less data in each shard after the prune step. Let's address the prune step.

In the example above, since data for users with ID modulus 1 are no longer being stored or referenced in database A, we can safely remove all of their data. You're going to need a second pair of underwear. The simplified query for pruning database A is, "delete all records for users with ID modulus 1". The inverse is done on database B. In our case, we ended up removing almost exactly half of the records for each additional shard we created. This was our plan: if each time we shard, the databases store half the data, we need half the Postgres box to serve the same data.

Imagine we have four records in database A before sharding and pruning: `[ W | X | Y | Z ]`. After sharding and pruning, database A might look like this: `[ W |     | Y |     ]`. Database B might look like this: `[     | X |     | Z ]`. Notice the gaps. This equates to hard disk fragmentation. This started biting us in the ass and would have likely made our lives hell if we didn't already have other tricks up our sleeves.

If database A looks like this: `[ W |     | Y |     ]`. When I ask "give me all records for user ID 0", it should return `W` and `Y`. But `W` and `Y` are not in contiguous places on disk. So in order to service this query, Postgres must first move the disk to `W`, then move the disk to `Y`, skipping over the gaps in between. If `W` and `Y` lived next to each other on disk, the disk would not have to work so hard to fetch both records. The more work to be done, the longer the query.

Generally, when new data is added to the table, it's put in contiguous slots at the end of the disk (regardless of the user ID). We then ran a `VACUUM ANALYZE` on the table. Postgres now says, "oh, there's space between `W` and `Y`, I can put new data there!" So when new data is added and then fetched, Postgres needs to spin all the way back to the beginning of the disk to fetch some records, while other records for the same user are at the end of disk. Fragmentation coupled with running a `VACUUM ANALYZE` put us up shit creek. Users with a lot of activity simply couldn't load their feeds. The only sanctioned way to fix fragmentation is hours of downtime.

Ok, I hope you're still with me. The solution and lesson here are important. Firstly, if our Postgres boxes were on SSDs, maybe fragmentation wouldn't have been such a big deal. We weren't on SSDs. The solution for us was to build a covering index so that we could service <a href="https://wiki.postgresql.org/wiki/Index-only_scans" target="_blank">index-only scans</a>. Effectively, what this means is that all fields used to filter and fetch data from a table must be stored in an index. If it's all in the index, Postgres does not need to go to disk for the data. So we added a covering index for our hottest query and saw about a 100x improvement on average, up to 7000x improvements for users with a lot of activity.

The lesson here is twofold. Serving data from memory is exponentially faster than serving from disk. Be leery of serving data from disk at scale. The second lesson is equally important. We probably should have just scaled vertically as much as possible. Webscale was too sexy to avoid. "Shard all the things" is the meme I'm looking for. Sharding was challenging and a better long-term solution, but had we applied a covering index for the whole entire table before doing any vertical sharding, I believe we could have saved tons of time and stress by simply adding more RAM as our database grew.

## Lesson 4: Don't create bottlenecks, or do

Early on, we made a decision that would have a profound affect on how we scaled the platform. You could either see it as a terrible decision or a swift kick in the ass. We chose to create an <a href="https://ello.co/ello" target="_blank">Ello user</a> that everyone automatically followed when they joined the network. It's pretty much the MySpace Tom of Ello. The intention was good; use the Ello user for announcements and interesting posts curated from the network, by the network. The problem is most of our scaling problems originated from this user.

All of the scaling issues that would have been irrelevant for months or years were staring us right in the face within the first month of having a significant user base. By automatically following the Ello user, it meant that just about all users would receive any posted content from that account. In effect, millions of records would be created every time the Ello user posted. This continues to be both a blessing and a curse. Database contention? Ello user is probably posting. Backed up queues? Ello user is probably posting. Luckily we control this account, and we actually had to disable it until sharding was complete and unique indexes were built.

What seemed like a benign additional at the time ended up having prodigious impacts on how we scale the platform. Posting to the Ello account puts more load on the system than anything else, and we use this to keep tabs on our future scaling plans. Culturally, it's important for us to be able to post from the Ello account. Technically, it's a huge burden. It means that we need to scale the platform in accordance with one user, which is silly. But in retrospect it's a godsend for keeping us on our toes and being proactive about scaling.

It makes me wonder if on future projects, it would be a good idea to implement the equivalent of the Ello user. Through induction of pain, we have a better infrastructure. So the lesson here is: if the platform must stay ahead of impending scaling challenges, it's probably a good idea to self-inflict the problems early and often.

## Lesson 5: It always takes 10 times longer

In the above sections, I managed to breeze through some difficult scaling lessons. Caching, sharding and optimizing are non-trivial engineering objectives. Thus far, I've been taken aback by just how difficult these endeavors end up being in practice.

Take caching the graph in Redis as an example. Going into it, it felt like something that could have been accomplished in a few days. The data's there, all we need to do is put it in Redis, and start directing traffic to Redis. Great, so step one is to write the scripts to migrate the data, that's easy. Step two is to populate the data in Redis. Oh, that's right, there are tens of millions of records that we're caching in multiple ways. Well, it'll take at least a couple hours to work our way through that many records. Yeah, but what about capturing the data that was inserted, updated and deleted within those two hours? We have to capture that as well. Better not have a bug in the migration process or there goes a few days of your life you'll never get back.

The sheer amount of practice alone for sharding can't be accounted for with a point-based estimate. Don't mess it up or you'll lose millions of peoples data. No pressure. But say you've practiced enough to get comfortable with the process and you're confident it will go well. Things will always arise. We added more shards and realized our <a href="https://wiki.postgresql.org/wiki/PgBouncer" target="_blank">pgbouncer</a> pool size was maxed out. Since the system was live and new data was being written to the new shards, we couldn't revert the changes or we'd lose data. We had to figure out on the fly that the non-intuitive errors meant we needed to increase the pool size. We didn't predict that disk fragmentation was going to be a huge problem, either, and ended up becoming a top priority.

While trying to apply a unique index to the activities table, who would have thought there were so many duplicates? The initial strategy was to attempt to build the index, and when it failed, let the error message tell us where we had to remove duplicates. Building an index is slow, duh, that won't scale if we have to attempt to build the index thousands of times. Ok, so write a query to remove the duplicates first. But wait, you can't just execute a blanket query a billion records, it will never finish and potentially acquire heavy locks for hours at a time. Ok, so page through all the users, and scope the query so it only removes duplicates for a subset of users. That works, but unfortunately there were a ton of orphaned rows for users that no longer existed. So while paging through all the users that currently exist, the query is not deleting records for users who no longer exist and for some reason have orphaned records. Ok, so write a query to remove all activities for orphaned users. But wait, since the activities table doesn't live in the same database as the users table, you can't join against the users table to determine which activities records are orphaned. Not that that would scale anyway.

Sorry for rambling, but you get the point. The lesson here is for your mental health during a time of rapid scale: plan on everything taking 10 times longer than you anticipate. It just will.

## Closing thoughts

You may have noticed a recurring theme within this article: the quantity of data is a big offender. There are other scaling challenges including team size, DNS, bot prevention, responding to users, inappropriate content, and other forms of caching. All of these can be equally laborious, but without a stable and scalable infrastructure, the opportunity for solving them diminishes.

Really, the TL;DR here is pretty short: cache aggressively, be proactive, push data into memory and scale vertically, highlight scaling bottlenecks sooner than later, and set apart plenty of man hours.

Oh, and enjoy the ride.

*19 comments*