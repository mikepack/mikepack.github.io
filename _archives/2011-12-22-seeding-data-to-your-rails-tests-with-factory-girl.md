---
title: "Seeding data to your Rails tests with factory_girl"
date: 2011-12-22
categories:
  - Archive
tags:
  - rails
  - rspec
  - testing
  - factory_girl
---

Many applications rely on seed data as a basic set of information to get their app off the ground and functional. Seed data to an application is like wheels to a car. Without the wheels, your car won't function.

The concept of seed data works great when thinking about how the applications functions in the real world. However, when running tests against your application, it poses the question of "Well, where did the data come from?" It's like the philosophical question of the chicken or the egg.

You have a test database ready to rock. You might even use `rake db:test:prepare` to get it set up. Now you run your specs and uh oh! they fail because your seed data doesn't exist. Lets review some solutions to this problem.

## Just seed the test database!

Stop with all the fuss and just seed the test database. `rake db:seed` and your test will be happy.

The problem with seeding your test database is you're now creating a dependency, and a large one at that. Every time you plan to execute your tests on a fresh database, you need the additional step of seeding. Not only that, but your tests are written to rely on an outside source to provide the seed data.

Your tests should viably run in a bubble. Give them an empty database and some application code and they should run to completion. Seeding the test database is an anti-pattern, in my opinion.

## Enter the seed data when appropriate

Say you have a User model and after the user is created, they are given a gold star award for signing up. Assume your awards are stored in an awards table with an Award model and are seeded into your application.

When your tests rely on seed data, they might look like this (using <a href="https://github.com/thoughtbot/factory_girl" target="_blank">factory_girl</a>):

```ruby
describe 'after signing up as a user'
  before do
    @user = Factory(:user)
  end

  it 'it gives me a gold star award' do
    @user.has_award('gold_star')
  end
end
```

In the above example, we're relying upon the fact that the gold star award has already been seeded into the database.

When your tests don't rely on seed data, they might look like this:

```ruby
describe 'after signing up as a user'
    before do
      # Add the gold star award
      Factory(:award, :name => 'gold_star')
      @user = Factory(:user)
    end
  
    it 'it gives me a gold star award' do
      @user.has_award('gold_star')
    end
end
```

Now you've successfully removed the dependency on the seed data and brought the responsibility of database inadequacies to the test suite. This is a great step forward in refactoring the tests but now, every time you create a User with Factory(:user), you need to add the gold star award to the database. Lets fix this up.

## Let factory_girl do the heavy lifting

factory_girl comes built in with a few callbacks. The available callbacks are #after_build, #after_create and #after_stub. Read more about using <a href="http://robots.thoughtbot.com/post/254496652/aint-no-calla-back-girl" target="_blank">factory_girl callbacks</a> on thoughtbot's blog (<a href="https://github.com/thoughtbot/factory_girl/blob/master/GETTING_STARTED.md" target="_blank">updated docs</a>).

So, in lieu of adding the gold star award right before creating a User in every one of our tests, lets use a callback when creating a User.

```ruby
FactoryGirl.define do
  factory :user do
    name "Mike Pack"
    after_build do |user|
      Factory(:award, :name => 'gold_star') unless Award.find_by_name('gold_star').present?
    end
  end
end
```

Now, our tests can be as clean as possible:

```ruby
describe 'after signing up as a user'
  before do
    @user = Factory(:user)
  end
  
  it 'it gives me a gold star award' do
    @user.has_award('gold_star')
  end
end
```

Every time a user is created with factory_girl, the dependency is built using the after_build callback.

Happy testing!

*2 comments*