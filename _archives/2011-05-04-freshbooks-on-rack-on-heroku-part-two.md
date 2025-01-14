---
title: "FreshBooks on Rack...on Heroku - Part Two"
date: 2011-05-04
categories:
  - Archive
tags:
  - freshbooks
  - rack
  - heroku
  - api
  - ruby-gems
  - metaprogramming
  - tutorials
  - series
---

In <a href="/archives/2011-05-01-freshbooks-on-rack-on-heroku-part-one/" target="_blank">Part One</a> of this series, we constructed a "hello world" Rack app, so to speak. In this part, we'll dive right into using the ruby-freshbooks gem and a little metaprogramming to keep things DRY.

Once again, for the entire source code, head to <a href="https://github.com/mikepack/freshbooks_on_rack" target="_blank">https://github.com/mikepack/freshbooks_on_rack</a>.

## Working with the ruby-freshbooks gem

ruby-freshbooks maps API calls in a somewhat object-oriented fashion. You can call #create, #update, #list, etc on a good number of API entities (like time_entry, client and staff). Check the <a href="http://developers.freshbooks.com/" target="_blank">FreshBooks API docs</a> for a full list of available methods. Generally, the methods are called like the following:

```ruby
connection = FreshBooks::Client.new('youraccount.freshbooks.com', 'yourfreshbooksapitoken')
connection.client.list
connection.staff.get :staff_id => 1
```

You can authenticate with your API token (as shown above) or OAuth. For instruction on authenticating with OAuth, check the <a href="https://github.com/elucid/ruby-freshbooks" target="_blank">ruby-freshbooks docs</a>.

Now, lets take a look at the full Rack app that simply prints out all the projects for N number of accounts, and totals the number of hours along with the total income.

Again, `FBOnRack#call` is invoked upon a request to our Rack app. This method is the heart and soul of our app.

`fb_on_rack.rb`

```ruby
require 'ruby-freshbooks'

class FBOnRack
  @cachable_entities = ['staff', 'task']

  def initialize
    @connections = [FreshBooks::Client.new('account1.freshbooks.com', 'apitoken1'),
                   FreshBooks::Client.new('account2.freshbooks.com', 'apitoken2')]
  end

  def call(env)
    res = Rack::Response.new
    res.write "<title>FreshBooks on Rack</title>"
    
    @connections.each do |connection|
      connection.project.list['projects']['project'].each do |project|
        res.write "<h1>Project: #{project['name']}</h1>"
        total_income = 0.0
        total_hours = 0.0

        connection.time_entry.list(:project_id => project['project_id'])['time_entries']['time_entry'].each do |entry|
          rate = get_rate(connection, project, entry)
          total_hours += entry['hours'].to_f
          total_income += rate.to_f * entry['hours'].to_f
        end
        res.write "Total hours: #{total_hours}<br />"
        res.write "Total income: #{total_income}<br />"
      end
    end

    res.finish
  end

private

  @cachable_entities.each do |entity_name|
    cache_var = instance_variable_set("@#{entity_name}_cache", {})
    get_entity = lambda do |connection, entity_id|
      if cache_var.has_key?(entity_id) # Check if the entity is already cached
        cache_var[entity_id]
      else
        entity = connection.send(entity_name).get(("#{entity_name}_id").to_sym => entity_id)[entity_name] # Make the API call for whatever entity
        cache_var[entity_id] = entity # Cache the API call
      end
    end
    define_method(("get_#{entity_name}").to_sym, get_entity)
  end

  def get_rate(connection, project, entry)
    case project['bill_method']
    when 'project-rate'
      project['rate']
    when 'staff-rate'
      get_staff(connection, entry['staff_id'])['rate']
    when 'task-rate'
      get_task(connection, entry['task_id'])['rate']
    end
  end
end
```

Lets break this down a little.

The first thing we should tackle is that strange loop at the start of the private definitions:

```ruby
@cachable_entities.each do |entity_name|
  cache_var = instance_variable_set("@#{entity_name}_cache", {})
  get_entity = lambda do |connection, entity_id|
    if cache_var.has_key?(entity_id) # Check if the entity is already cached
      cache_var[entity_id]
    else
      entity = connection.send(entity_name).get(("#{entity_name}_id").to_sym => entity_id)[entity_name] # Make the API call for whatever entity
      cache_var[entity_id] = entity # Cache the API call
    end
  end
  define_method(("get_#{entity_name}").to_sym, get_entity)
end
```

The gist of this is to define a caching mechanism so we're not slamming the FreshBooks API. If we fetch an entity by the entity's ID, cache the result for that ID. Let's break this chunk of code down once we're inside the loop:

```ruby
cache_var = instance_variable_set("@#{entity_name}_cache", {})
```

This does what you would expect: it defines an instance variable. `@cachable_entities` contains two entities we want to cache, *staff* and *task*. So in the end we have two class instance variables which act as in-memory cache: `@staff_cache = {}` and `@task_cache = {}`.

```ruby
get_entity = lambda do |connection, entity_id|
  if cache_var.has_key?(entity_id) # Check if the entity is already cached
    cache_var[entity_id]
  else
    entity = connection.send(entity_name).get(("#{entity_name}_id").to_sym => entity_id)[entity_name] # Make the API call for whatever entity
    cache_var[entity_id] = entity # Cache the API call
  end
end
```

Here we define a closure which will fetch our result either from the cache or make a call to the API. After retrieving our entity from the API, we cache it.

```ruby
define_method(("get_#{entity_name}").to_sym, get_entity)
```

Here we define our methods (`#get_staff(connection, staff_id)` and `#get_task(connection, task_id)`) as private instance methods. The `get_entity` parameter here is our lambda closure we defined above.

`#get_staff` and `#get_task` are called within our `#get_rate` method (but could be used elsewhere). `#get_rate` returns the rate which should be used for a given time entry. Rates can be project-based, staff-based or task-based. We need to find the appropriate rate based on the `project['bill_method']`.

Modify this code to your needs, restart your Rack server, visit `http://localhost:9292/` and you should see all your projects, the total time spent on each and the total income from each.

If you've made it this far, give yourself a pat on the rear because this part in the series is definitely the hardest. Let me know if you have any issues understanding the FBOnRack class above. In Part Three of this series, we'll finish off by deploying to <a href="http://www.heroku.com/" target="_blank">Heroku</a> and baking a cake.

*0 comments*