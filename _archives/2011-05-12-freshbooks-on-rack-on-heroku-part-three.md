---
title: "FreshBooks on Rack...on Heroku - Part Three"
date: 2011-05-12
categories:
  - Archive
tags:
  - freshbooks
  - rack
  - heroku
  - api
  - deployment
  - git
  - tutorials
  - series
---

In <a href="/archives/2011-05-01-freshbooks-on-rack-on-heroku-part-one/" target="_blank">Part One</a> of this series, we constructed a "hello world" Rack app. In <a href="/archives/2011-05-04-freshbooks-on-rack-on-heroku-part-two/" target="_blank">Part Two</a> of this series, we brought our app to life with the ruby-freshbooks library. In this part, we'll quickly finish out by deploying our app to Heroku.

For the entire source code, head to <a href="https://github.com/mikepack/freshbooks_on_rack" target="_blank">https://github.com/mikepack/freshbooks_on_rack</a>.

## Getting the app on Heroku

The next step is getting your app on <a href="http://www.heroku.com/" target="_blank">Heroku</a>. You'll need a Heroku account first, obviously, and you'll need to <a href="http://devcenter.heroku.com/articles/keys" target="_blank">configure your Heroku account</a> so that your SSH key is recognized.

First, create your git repository and commit your files:

```
cd fb_on_rack_dir
git init
git add .
git commit -m 'Here is the app!'
```

Create your Heroku app:

```
heroku create your-fb-heroku-app
```

Push your changes to Heroku:

```
git push heroku master
```

Check it out! Open your browser, head to `http://your-fb-heroku-app.heroku.com` and you should see your running Rack app iterating over all your projects.

## Rack HTTP Basic Authentication

Most likely, with all those valuable numbers, you don't want your app exposed to the world. The most simple way to remedy this is to add HTTP Basic Auth to your app. Rack makes this dead easy.

Change your `config.ru` file to look like the following:

**config.ru**

```
require 'rack'
require 'fb_on_rack'

use Rack::Auth::Basic, "FreshBooks on Rack" do |user, pass|
  user == 'me' and pass == 'secret'
end

run FBOnRack.new
```

This will present you with the oh-so-familiar HTTP Basic Auth prompt. We've hardcoded the username and password to be `me` and `secret`, respectively. You're now protected from all those internet wanderers.

## A quick note about simplicity

While I greatly appreciate <a href="https://github.com/elucid" target="_blank">elucid</a>'s work on the library, ruby-freshbooks isn't perfect. During the creation of this app, I got some unexpected values as I was iterating through result sets. For instance, one iteration would provide me with a hash and the next an array. Here's an error indicative of the inconsistent result set:

```
TypeError at /
cant convert String into Integer 

Ruby /mnt/hgfs/share/freskbooks_on_rack/fb_on_rack.rb: in [], line 25
Web  GET localhost/
```

If you see this error, check your result set and handle it appropriately.

In Ruby 1.9.2, I would receive the following error as I started the Rack app with *rackup*:

```
ruby-1.9.2-p136/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require': no such file to load -- fb_on_rack (LoadError)
```

This error is due to changes in Ruby 1.9 require's path expectation. To fix this...

**config.ru**

```
require 'fb_on_rack'
```

...should look like...

**config.ru**

```
require './fb_on_rack'
```

I wouldn't, by a stretch, call this a production-ready app. In lieu of handling all error and usecase situations, I kept it simple. My main goal is to show you the basics of working with the ruby-freshbooks gem and the potential it holds for aggregating important data.

Happy Freshbooking!

*0 comments*