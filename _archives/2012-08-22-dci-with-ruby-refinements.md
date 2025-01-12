---
title: "DCI with Ruby Refinements"
date: 2012-08-22
categories:
  - Archive
tags:
  - dci
  - ruby
  - refinements
---

**TL;DR** - Have your cake and eat it too. Ruby refinements, currently in 2.0 trunk, can cleanly convey DCI role injection and performs right on par with `#include`-based composition. However, there's some serious caveats to using refinements over `#extend`.

Recently, refinements was <a href="http://blog.wyeworks.com/2012/8/3/ruby-refinements-landed-in-trunk/" target="_blank">added to Ruby trunk</a>. If you aren't yet familiar with refinements, read Yahuda's <a href="http://yehudakatz.com/2010/11/30/ruby-2-0-refinements-in-practice/" target="_blank">positive opinion</a> as well as Charles Nutter's <a href="http://groups.google.com/group/ruby-core-google/msg/7ccc375905dda23c" target="_blank">negative opinion</a>. The idea is simple:

```ruby
module RefinedString
  refine String do
    def some_method
      puts "I'm a refined string!"
    end
  end
end

class User
  using RefinedString

  def to_s
    ''.some_method #=> "I'm a refined string!"
  end
end

''.some_method #=> NoMethodError: undefined method `some_method' for "":String
```

It's just a means of monkeypatching methods into a class, a (still) controversial topic. In the above example, the User class can access the `#some_method` method on strings, while this method is non-existent outside the lexical scope of User.

## Using Refinements in DCI

Refinements can be used as a means of role-injection in DCI, amongst <a href="/archives/2012-02-08-dci-role-injection-in-ruby/" target="_blank">the many other techniques</a>. I personally like this technique because the intention of the code is clear to the reader. However, it has some serious drawbacks which we'll address a bit later.

Let's say we want to add the method `#run` to all Users in a given context.

Our User class:

```ruby
class User; end
```

Our refinement of the User class:

```ruby
module Runner
  refine User do
    def run
      puts "I'm running!"
    end
  end
end
```

In the above refinement, we are adding the `#run` method to the User class. This method won't be available unless we specifically designate its presence.

Our DCI context:

```ruby
class UserRunsContext
  using Runner

  def self.call
    User.new.run   
  end
end
```

Here, we're designating that we would like to use the refinement by saying `using Runner`. The `#run` method is then available for us to use within the context trigger, `#call`.

Pretty clear what's happening, yeah?

I wouldn't go as far as saying it carries the expressiveness of calling `#extend` on a user object, but it gets pretty darn close. To reiterate, the technique I'm referring to looks like the following, without using refinements:

```ruby
user = User.new
user.extend Runner
user.run
```

## Benchmarking Refinements

I'm actually pretty impressed on this front. Refinements perform quite well under test. Let's observe a few of role injection: using inclusions, refinements and extensions.

I ran these benchmarks using Ruby 2.0dev (revision 35783) on a MacBook Pro - 2.2 GHz - 8 GB ram.

Check out <a href="https://github.com/mikepack/dci_benchmarks" target="_blank">the source for these benchmarks</a> to see how the data was derived.

### #include (<a href="https://github.com/mikepack/dci_benchmarks/blob/master/include_bm.rb" target="_blank">source</a>)

*Example*

```ruby
class User
  include Runner
end
```

*Benchmarks*

```
> ruby include_bm.rb
```

```
         user     system    total     real
include  0.560000  0.000000  0.560000 (  0.564124)
include  0.570000  0.000000  0.570000 (  0.565348)
include  0.560000  0.000000  0.560000 (  0.563516)
```

### #refine (<a href="https://github.com/mikepack/dci_benchmarks/blob/master/refinement_bm.rb" target="_blank">source</a>)

*Example*

```ruby
class User; end
class Context
  using Runner
  ...
end
```

*Benchmarks*

```
> ruby refinement_bm.rb
```

```
        user     system    total     real
refine  0.570000  0.000000  0.570000 (  0.566701)
refine  0.580000  0.000000  0.580000 (  0.582464)
refine  0.570000  0.000000  0.570000 (  0.572335)
```

### #extend (<a href="https://github.com/mikepack/dci_benchmarks/blob/master/dci_bm.rb" target="_blank">source</a>)

*Example*

```ruby
user = User.new
user.extend Runner
```

*Benchmarks*

```
> ruby dci_bm.rb
```

```
     user     system    total     real
DCI  2.740000  0.000000  2.740000 (  2.738293)
DCI  2.720000  0.000000  2.720000 (  2.721334)
DCI  2.720000  0.000000  2.720000 (  2.720715)
```

The take home message here is simple: `#refine` performs equally as well as `#include` although significantly better than `#extend`. To no surprise, `#extend` performs worse than both `#refine` and `#include` because it's injecting functionality into objects instead of classes, for which we have 1,000,000 and 1, respectively.

Note: You would never use `#include` in a DCI environment, namely because it's a class-oriented approach.

## Separation of Data and Roles

What I enjoy most about the marriage of refinements and DCI is that we still keep the separation between data (User) and roles (Runner). A critical pillar of DCI is the delineation of data and roles, and refinements ensure the sanctity of this concern. The only component in our system that *should* know about both data and roles is the context. By calling `using Runner` from within our UserRunsContext, we've joined our data with its given role in that context.

An example of when we break this delineation can be expressed via a more compositional approach, using include:

```ruby
class User
  include Runner
end
```

The problem with this approach is the timing in which the data is joined with its role. It gets defined during the class definition, and therefore breaks the runtime-only prescription mandated by DCI. Furthermore, the include-based approach is a class-oriented technique and can easily lead us down a road to fat models. Consider if a User class had all its possible roles defined right there inline:

```ruby
class User
  include Runner
  include Jogger
  include Walker
  include Crawler
  ...SNIP...
end
```

It's easy to see how this could grow unwieldy.

## Object-Level Interactions and Polymorphism

Another pillar of DCI is the object-level, runtime interactions. Put another way, a DCI system must exhibit object message passing in communication with other objects at runtime. Intrinsically, these objects change roles depending on the particular context invoked. A User might be a Runner in one context (late for work) and a Crawler in another (infant child).

The vision of James Coplien, co-inventor of DCI, is tightly aligned with Alan Kay's notion of object orientation:

> "I thought of objects being like biological cells and/or individual computers on a network, only able to communicate with messages." - Alan Kay

So, as roles are injected into data objects, **do refinements satisfy the object-level interactions required by DCI?** Debatable.

With refinements, we're scoping our method definitions within the bounds of a class. With modules, we're scoping our methods within the abstract bounds of whatever consumes the module. By defining methods within a module, we're essentially saying, "I don't care who consumes my methods, as long as they conform to a specific interface." Further, in order to adhere to Alan Kay's vision of object orientation, our objects must be dynamically modified at runtime to accommodate for the context at hand. The use of modules and `#extend` ensures our data objects acquire the necessary role *at runtime*. Refinements, on the other hand, do not adhere to this mantra.

Along similar lines, let's look at how refinements affect polymorphism. Specifically, we want to guarantee that a role can be played by any data object conforming to the necessary interface. In statically-typed systems and formal implementations of DCI, this is particularly important because you would be defining "methodless roles", or interfaces, for which "methodful roles" would implement. These interfaces act as guards against the types of objects which can be passed around. When we work with refinements and class-specific declarations, we lose the polymorphism associated with the module-based approach. This can be conveyed in the following example:

```ruby
module Runner
  def run
    puts "I have #{legs} and I'm running!"
  end
end

# The Runner role can be used by anyone who conforms to
# the interface. In this case, anyone who implements the
# #legs method, which is expected to return a number.
User.new.extend Runner
Cat.new.extend Runner
Dog.new.extend Runner

# When we use refinements, we lose polymorphism.
# Notice we have to redefine the run method multiple times for each
# possible data object.
module Runner
  refine User do
    def run
      puts "I have #{legs} and I'm running!"
    end
  end

  refine Cat do
    def run
      puts "I have #{legs} and I'm running!"
    end
  end

  refine Dog do
    def run
      puts "I have #{legs} and I'm running!"
    end
  end
end
```

The really unfortunate thing about refinements is we have to specify an individual class we wish to refine. We're not able to specify multiple classes to refine. So, we can't do this:

```ruby
module Runner
  refine User, Cat, Dog do # Not possible.
    def run
      puts "I have #{legs} and I'm running!"
    end
  end
end
```

But even if we could supply multiple classes to refine, we're displacing polymorphism. Any time a new data object can play the role of a Runner (it implements `#legs`), the Runner role needs to be updated to include the newly defined data class. The point of polymorphism is that we don't really care what type of object we're working with, as long as it conforms to the desired API. With refinements, since we're specifically declaring the classes we wish to play the Runner role, we lose all polymorphism. That is to say, if some other type, say Bird, conforms to the interface expected of the Runner role, it can't be polymorphically interjected in place of a User.

## Wrapping Up

Refinements are a unique approach to solving role injection in DCI. Let's look at some pros and cons of using refinements:

*Pros*

- `#refine` provides a clean syntax for declaring data-role interactions.
- Refinements perform around 500% better than `#extend` in DCI.
- The data objects are clean after leaving a context. Since the refinements are lexically scoped to the context class, when the user object leaves the context, its `#run` method no longer exists.

*Cons*

- We lose all polymorphism! Roles cannot be injected into API-conforming data objects at runtime. Data objects must be specifically declared as using a role.
- We can't pass multiple classes into `#refine`, causing huge maintenance hurdles and a large degree of duplication.
- We lose the object-level, cell-like interaction envisioned by Alan Kay in which objects can play multiple and sporatic roles throughout their lifecycle.
- Testing. We didn't cover this, but in order to test refinements, you would need to apply the cleanroom approach with a bit of test setup. In my opinion, this isn't as nice as testing the results of method after using `#extend`.

While there's certainly some benefits to using refinements in DCI, I don't think I could see it in practice. There's too much overhead involved. More importantly, I feel it's critical to maintain Alan Kay's (and James Coplien's) vision of OO: long-lived, role-based objects performing variable actions within dynamic contexts.

After all this...maybe I should wait to see if refinements even make it into Ruby 2.0 😉.

Happy refining!

*17 comments*