---
title: "Managing Devise's current_user, current_admin and current_troll with CanCan"
date: 2011-07-21
categories:
  - Archive
tags:
  - rails
  - devise
  - cancan
  - authentication
  - authorization
  - security
---

<a href="https://github.com/ryanb/cancan" target="_blank">CanCan</a> is awesome. It lets you manage user abilities easily and provides ways to define complex scenarios. I highly recommend using it for anyone who has more than one user type (like Troll).

<a href="https://github.com/plataformatec/devise" target="_blank">Devise</a> is great for authentication. When you have more than one user type as distinct classes, Devise will create current_* to be used in your controllers and views. So, User class corresponds to `current_user`. Admin class corresponds to `current_admin`. Troll class (used to identify Trolls under your application's bridge) corresponds to `current_troll`.

## The problem

CanCan doesn't work with `current_admin` and `current_troll` out-of-the-box. It assumes that `current_user` is defined and `current_user`'s abilities are defined in the Ability class. What if you want to break this paradigm? It turns out CanCan makes this pretty easy. Here are the <a href="https://github.com/ryanb/cancan/blob/master/lib/cancan/controller_additions.rb" target="_blank">current_user and Ability assumptions</a> I am referring to:

```ruby
def current_ability
  @current_ability ||= ::Ability.new(current_user)
end
```

CanCan defines `current_ability` on your controller. This grabs an instance of the Ability class for the current user. So it assumes that you have `current_user` set and you have an Ability class defined. When your user types get more complex than what can be handled by one User model, it's time to make some changes.

## Working with numerous Ability classes

Up front, your project might not require many different user types that vary greatly from one another. It might make sense to use Rail's nifty <a href="http://api.rubyonrails.org/classes/ActiveRecord/Base.html" target="_blank">STI</a> (Single Table Inheritance) and add all your abilities to one class. This can be nice in some respect. For instance, all users, no matter which type, can be reference by `current_user`.

When your user types get too complex to use one User model, your Ability class is too complex as well. In it's most simple form, say you have an Ability class that looks as follows:

```ruby
class Ability
  include CanCan::Ability
  
  def initialize(user)
    user ||= User.new # guest user (not logged in)
    if user.is_a? Admin
      # Admin abilities
    elsif user.is_a? Troll
      # Troll abilities
    elsif user.new_record?
      # Guest abilities
    else
      # Basic user abilities
    end
  end
end
```

This structure gives you some flexibility in how you define your abilities but it's on it's way to Maintenance Hell, a deep dark place with no exit.

It would be best to define your abilities in different classes. Here we define UserAbility, AdminAbility, TrollAbility, and GuestAbility.

```ruby
class UserAbility
  include CanCan::Ability

  def initialize(user)
    # Basic user abilities
  end
end
```

```ruby
class AdminAbility
  include CanCan::Ability

  def initialize
    # Admin abilities
  end
end
```

```ruby
class TrollAbility
  include CanCan::Ability

  def initialize(user)
    # Troll abilities
  end
end
```

```ruby
class GuestAbility
  include CanCan::Ability

  def initialize
    # Guest abilities
  end
end
```

Keep in mind that if your abilities are a subset of another user's abilities, you can inherit from other ability class. So in our case a Troll is a user who lives under a bridge. We don't want the Trolls to talk, so we limit their ability to post comments. Otherwise, they can do everything a User can do.

```ruby
class TrollAbility < UserAbility
  def initialize(user)
    super(user)
    cannot :create, Comment
    # More Troll abilities
  end
end
```

## Hooking up the Ability classes

When you use CanCan's `can? :create, Comment` method, it refers to `current_ability` to determine whether the given abilities include :create, Comment.

Since CanCan makes the assumption we're working with `current_user` and strictly Ability, we need to extend the built-in functionality. We do this by instantiating the new Ability classes based on the current user type (defined by Devise). CanCan has a <a href="https://github.com/ryanb/cancan/wiki/Changing-Defaults" target="_blank">brief wiki post on this topic</a>.

```ruby
def current_ability
  @current_ability ||= case
                      when current_user
                        UserAbility.new(current_user)
                      when current_admin
                        AdminAbility.new
                      when current_troll
                        TrollAbility.new(current_troll)
                      else
                        GuestAbility.new
                      end
end
```

Now, when CanCan needs to check abilities (when you call `can? :create, Comment`), your `current_ability` method will return the appropriate Ability class.

Happy CanCaning!

*4 comments*