---
title: "FreshBooks on Rack...on Heroku - Part One"
date: 2011-05-01
categories:
  - Archive
tags:
  - freshbooks
  - rack
  - heroku
  - api
---

I love <a href="http://www.freshbooks.com/" target="_blank">FreshBooks</a>. It makes my time tracking incredibly easy and my invoicing hassle free. That's not all; their website is extremely powerful but feels lightweight and friendly to use. As a software engineer, I really appreciate and expect my invoicing tool to be Web 2.0 and fun.

For it's free account, FreshBooks only allows you to have 3 clients. You can have any number of projects under those 3 clients but they set a cap in hopes you'll pay for their service. Well, I have more than 3 clients and I love freemium. FreshBooks allows you to have any number of freemium accounts. While it's a pain in the ass to have to switch between accounts for invoicing, it's worth the $20/month I'm saving...for now.

Another annoying thing about working with numerous freemium accounts is you can't quickly calculate numbers based on all projects you have. For instance, the total income from all projects or the total projected income for a single month. To remedy this, I wanted to create a lightweight <a href="http://www.heroku.com/" target="_blank">Heroku</a> app which would poll all my FreshBook freemium accounts and calculate some numbers, specifically the total hours spent and the total income for each project. FreshBooks has an API which allows me to do just that. +1 FreshBooks!

In this three-part series we'll build the app from the ground up, starting with Rack and then deploying to Heroku. Lets get started.

For the source of the entire project, head to <a href="https://github.com/mikepack/freshbooks_on_rack" target="_blank">https://github.com/mikepack/freshbooks_on_rack</a>.

## Rails to Rack

One consideration for this little project is the framework to use or if a framework is appropriate at all. I sought the following:

- Rack based...It needs to run on Heroku
- Lightweight...I don't have a model so I don't *need* MVC

I love frameworks. They make most arduous tasks simple. I'm a <a href="http://rubyonrails.org/" target="_blank">Rails</a> programmer but I realize for a project this small, Rails is `way` overkill. Other potential overkill frameworks include <a href="http://www.merbivore.com/" target="_blank">Merb</a>, <a href="http://www.sinatrarb.com/" target="_blank">Sinatra</a> and even <a href="http://camping.rubyforge.org/" target="_blank">Camping</a>. I stumbled upon <a href="http://www.rocket.ly/waves" target="_blank">Waves</a>, a resource oriented, ultra-lightweight framework. Unfortunately, Waves has been dead since 2009. So I decided to ditch the framework and go straight to <a href="http://rack.rubyforge.org/" target="_blank">Rack</a>.

## Rack Setup

If you don't have Rack yet, install the gem:

```
gem install rack
```

Create a directory for your project:

```
mkdir freshbooks_on_rack
cd freshbooks_on_rack
```

Rack expects a configuration file to end in .ru:

**config.ru**

```
require 'rack'
```

You should now be able to run your Rack application from the command line:

```
rackup
```

Visit `http://localhost:9292/` to see your app in action. It won't do anything yet (it'll throw an error), but the Rack basics are there.

## FreshBooks Setup

FreshBooks has a great <a href="http://developers.freshbooks.com/" target="_blank">API</a>. There's also a great corresponding <a href="https://github.com/elucid/ruby-freshbooks" target="_blank">gem</a> which ruby-fies the API responses. The ruby-freshbooks gem is an isomorphic, flexible library with very little dependencies. <a href="https://github.com/bcurren/freshbooks.rb" target="_blank">freshbooks.rb</a> is another FreshBooks API wrapper gem but has one major quip: it uses a global connection so you can't (naturally) pull in information from different FreshBooks accounts.

Heroku uses Bundler so create a Gemfile (you don't need the rack gem in your Gemfile):

**Gemfile**

```
source 'http://rubygems.org'
gem 'ruby-freshbooks'
```

Install the gem with Bundler:

```
bundle
```

## Creating the Rack App

Let's create a class which will handle our Rack implementation:

**fb_on_rack.rb**

```ruby
require 'ruby-freshbooks'

class FBOnRack
  def call(env)
    res = Rack::Response.new
    res.write '<title>FreshBooks on Rack</title>'
    res.finish
  end
end
```

All our class does so far is respond to a Rack call with a title tag. I use Rack::Response here to make things a little easier when it comes to the expected return value of our `#call` method. Take a look at <a href="http://chneukirchen.org/blog/archive/2007/02/introducing-rack.html" target="_blank">this example</a> for a reference on how to respond without using Rack::Response.

Now lets update our config.ru file to call our FBOnRack class:

**config.ru**

```
require 'rack'
require 'fb_on_rack'

run FBOnRack.new
```

`FBOnRack#call` will now be invoked when a request is made to our Rack app. Restart your Rack app (you'll need to do this on every code change), visit `http://localhost:9292/` and you should see a blank page with a title of "FreshBooks on Rack".

Tada! You've just created a sweet Rack app, you should feel proud. In Part Two of this series, we'll take a look at how to work with the ruby-freshbooks gem. We'll generate simple, yet useful data and get our hands dirty in some metaprogramming.

*0 comments*