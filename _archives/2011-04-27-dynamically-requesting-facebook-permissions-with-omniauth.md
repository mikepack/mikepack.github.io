---
title: "Dynamically Requesting Facebook Permissions with OmniAuth"
date: 2011-04-27
collaction: archives
categories:
  - Archive
tags:
  - ruby
  - rails
  - omniauth
  - facebook
---

One of the major benefits of dynamically requesting the Facebook permissions is the increased rate of users who will allow you to access their account. Facebook <a href="http://developers.facebook.com/docs/authentication/" target="_blank">puts it nicely</a>, "There is a strong inverse correlation between the number of permissions your app requests and the number of users that will allow those permissions."

This solution uses OmniAuth to handle the authentication. The concept is simple. Ask the user to allow your application access to their most basic information (or the bare minimum your app needs). When they perform an action that requires more than the permissions they have currently allowed, redirect them to Facebook and ask for more permissions.

If you haven't set up OmniAuth, follow Ryan Bate's Railscasts, <a href="http://railscasts.com/episodes/235-omniauth-part-1" target="_blank">Part 1</a> and <a href="http://railscasts.com/episodes/236-omniauth-part-2" target="_blank">Part 2</a>.

## Configuring OmniAuth

OmniAuth expects you to configure your authentication schemes within your initializers.

`config/initializers/omniauth.rb`

```ruby
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, ENV['FB_APP_ID'], ENV['FB_APP_SECRET']
end
```

Now, when you visit `/auth/facebook`, you will be redirected to Facebook and asked for basic permissions.

In order to permit your app to dynamically change the OmniAuth Stategy, you'll need a controller which has access to your OmniAuth Strategy. OmniAuth provides a <a href="https://github.com/intridea/omniauth/wiki/Dynamic-Providers" target="_blank">pre-authorization setup hook</a> to handle this. Update your omniauth.rb initializer to look like the following:

`config/initializers/omniauth.rb`

```ruby
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, ENV['FB_APP_ID'], ENV['FB_APP_SECRET'], :setup => true
end
```

Now when you visit `/auth/facebook` you'll be redirected to `/auth/facebook/setup`. You should add a route for this:

`config/routes.rb`

```ruby
match '/auth/facebook/setup', :to => 'facebook#setup'
```

Your Facebook controller with the setup action should look as follows:

`app/controllers/facebook_controller.rb`

```ruby
class FacebookController < ApplicationController
  def setup
    request.env['omniauth.strategy'].options[:scope] = session[:fb_permissions]
    render :text => "Setup complete.", :status => 404
  end
end
```

**Note:** <a href="https://github.com/intridea/omniauth/wiki/Dynamic-Providers" target="_blank">OmniAuth says</a>, "we render a response with a `404` status to let OmniAuth know that it should continue on with the authentication flow."

Once your FacebookController#setup action has completed, OmniAuth will take it from there and process your request through to Facebook.

## Dynamically Setting the Permissions

The appropriate code can be used like so:

`app/controllers/some_controller.rb`

```ruby
session[:fb_permissions] = 'user_events'
redirect_to '/auth/facebook'
```

`session[:fb_permissions]` is the interface between your two controller actions: the one that wants to request more permissions (some_controller.rb) and the one that wants to modify your OmniAuth Strategy (facebook_controller.rb).

For reference, here's a <a href="http://developers.facebook.com/docs/authentication/permissions/" target="_blank">list of available Facebook permissions</a> you can use; comma deliminated.

That's it. Upon redirection, Facebook will ask to allow the new permissions, redirect back to your app, and you can now successfully make calls to the Facebook API (I use <a href="https://github.com/arsduo/koala" target="_blank">Koala</a> to work with the Facebook API).

## One Gotcha

One thing I ran into on OmniAuth 0.2.4 and Rails 3.0.7 is the OmniAuth Stategy which was available in `request.env['omniauth.stategy']`. If you have more than one provider in your OmniAuth::Builder DSL, `request.env['omniauth.stategy']` will be set to *the last entry in the DSL*. If you have your initializer set up like the following:

```ruby
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, ENV['FB_APP_ID'], ENV['FB_APP_SECRET'], :setup => true
  provider :twitter, ENV['TWITTER_CONSUMER_KEY'], ENV['TWITTER_CONSUMER_SECRET']
end
```

`request.env['omniauth.stategy']` will be set to #<OmniAuth::Strategies::Twitter>, not exactly what you want. Your Facebook stategy needs to be the last entry in the DSL, like so:

```ruby
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :twitter, ENV['TWITTER_CONSUMER_KEY'], ENV['TWITTER_CONSUMER_SECRET']
  provider :facebook, ENV['FB_APP_ID'], ENV['FB_APP_SECRET'], :setup => true
end
```

Happy Facebooking!

*9 comments*