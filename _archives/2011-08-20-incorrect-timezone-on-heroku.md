---
title: "\"Incorrect\" Timezone on Heroku"
date: 2011-08-20
categories:
  - Archive
tags:
  - heroku
  - time 
---

This is just a friendly reminder that `Time.now` on Heroku will give you server time, ie: PDT/PST, and not the local time for your app.

Since usually you want time calculations to be done with the correct zone for your app, just make sure to include 'zone' in your call for `Time.now`, like so:

```ruby
Time.zone.now
```

I have the following in my config:

`config/application.rb`

```ruby
config.time_zone = 'Mountain Time (US & Canada)'
```

Here's the difference for me in Heroku's console:

```ruby
Time.now #=> 2011-08-20 18:53:06 -0700
Time.zone.now #=> Sat, 20 Aug 2011 19:53:08 MDT -06:00
```

So, remember, always use `Time.zone.now` instead of `Time.now`.

Happy time travel!

*2 comments*