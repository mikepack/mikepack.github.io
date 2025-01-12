---
title: "Testing Mobile Rails Apps with Capybara"
date: 2011-06-16
categories:
  - Archive
tags:
  - rails
  - testing
  - rspec
  - capybara
  - mobile
---

Every web app should have a mobile version and every mobile version should be tested. Testing mobile web apps shouldn't be any more painful than testing desktop apps with the assumption that you're still serving up HTML, CSS, and JavaScript.

# My Setup

For mobile detection, I use <a href="https://github.com/shenoudab/active_device" target="_blank">ActiveDevice</a>, a User Agent sniffing library and some helper methods. While User Agent sniffing isn't the best approach for client-side (use feature detection with something like <a href="http://www.modernizr.com/" target="_blank">Modernizr</a>), it's a reliable way to detect mobile devices in Rails.

For acceptance testing that doesn't need to be readily demonstrated to stakeholders, I use straight up <a href="https://github.com/jnicklas/capybara" target="_blank">Capybara</a> with <a href="https://github.com/rspec/rspec" target="_blank">RSpec</a>. Sometimes I use <a href="https://github.com/cavalle/steak" target="_blank">Steak</a>.

# The Pain of Testing Mobile

It's difficult to test mobile web apps because Capybara's default drivers are all desktop User Agents. You could acquire <a href="https://github.com/rhburrows/capybara-iphone" target="_blank">Capybara-iphone</a>, but this solution didn't produce the expected results for me. I was given my mobile views but not my mobile layout. Plus, all this driver does is reset the User Agent for the Rack-Test driver. Further, what if you use Selenium for your default driver?

Platformatec wrote a nice blog post about <a href="http://blog.plataformatec.com.br/2011/03/configuring-user-agents-with-capybara-selenium-webdriver/" target="_blank">mobile testing with user agents</a>. The problem is it relies on Selenium. I was seeking a more concrete, driver agnostic way to serve up mobile views to my tests.

# How I Test Mobile

This is a simple, straightforward way to invoke your mobile app from within your tests. I'm not convinced it's the most elegant way, but it's clean and simple.

## Setup Your Application

In your ApplicationController, give some support for changing over to your mobile app. This will also come in handy when you want to work on and test your mobile app on your desktop browser.

`app/controllers/application_controller.rb`

```ruby
@@format = :html
cattr_accessor :format
```

Here we simply add a class attribute accessor with a default of :html. This will allow us to say ApplicationController.format

Next we need to add a before filter which will set the desired format upon each request.

`app/controllers/application_controller.rb`

```ruby
before_filter :establish_format

private

def establish_format
  # If the request is from a true mobile device, don't set the format
  request.format = self.format unless request.format == :mobile
end
```

Here's what a sample Rails 3 ApplicationController would look like:

`app/controllers/application_controller.rb`

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery
  include ActiveDevice

  # force the mobile version for development:
  #@@format = :mobile
  @@format = :html
  cattr_accessor :format
  before_filter :establish_format

private
  def establish_format
    # If the request is from a true mobile device, don't set the format
    request.format = self.format unless request.format == :mobile
  end
end
```

## Setup Your Tests

Now, in your tests, you can set the desired format for your application.

`spec/integration/mobile/some_spec.rb`

```ruby
require 'spec_helper'

describe 'on a mobile device' do
  before do
    ApplicationController.format = :mobile
  end

  after do
    ApplicationController.format = :html
  end

  describe 'as a guest on the home page' do
    before do
      visit root_path
    end

    it 'does what I want' do
      page.should do_what_i_want
    end
  end
end
```

By setting ApplicationController.format = :mobile, we force the application to render the mobile version of files, for instance: `index.mobile.erb`. Your application will be invoked, your before filter will be run, and your are serving the mobile app to your tests.

**Note:** You need to reset your format to :html after your mobile tests are run so that tests which follow this in your suite are run under the default format, :html.

Happy testing!

*0 comments*