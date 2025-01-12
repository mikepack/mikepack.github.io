---
title: "DCI and the Single Responsibility Principle"
date: 2013-03-12
categories:
  - Archive
tags:
  - dci
  - oop
  - solid
  - srp
---

The single responsibility principle (SRP) is one of the most widely followed ideals in object oriented programming. For decades, developers have been striving to ensure their classes take on just enough, but not too much, responsibility. A valiant effort and by far one of the best ways to produce maintainable code.

SRP is hard, though. Of all the <a href="http://en.wikipedia.org/wiki/SOLID_(object-oriented_design)" target="_blank">SOLID design principles</a>, it is the most difficult to embrace. Due to the abstract nature if its definition, based purely on example instead of directive process, it's hard to concretize. More specifically, it's difficult to define "responsibility", in general or in context. There are some rules-of-thumb to help, like reasons for change, but even these are enigmatic and hard to apply.

Simply put, SRP says a class should be comprised of just one responsibility, and only a single reason should force modification.

Let's take a look at the following class which clearly has three responsibilities and therefore breaks SRP:

```ruby
class User < ActiveRecord::Base
  def check_in(location); ... end
  def solr_search(term); ... end
  def request_friendship(other_user); ... end
end
```

This class would require churn for a variety of reasons, some of which include:

1. The algorithm for checking in changes.
2. The fields used to search SOLR are renamed.
3. Additional information needs to be stored when requesting a friendship.

So, based on the rules of SRP, this class needs to be broken out into three different classes, each with their own responsibility. Awesome, we're done, right? This is often the extent of discussions around SRP, because it's extremely difficult to provide solutions beyond contrived, minute examples. Theoretically, SRP is very easy to follow. In practice, it's much more opaque. It's too pie in the sky for my taste; like most OOP principles, I think SRP should be more of a guideline than a hard-and-fast rule.

The real difficulty of SRP surfaces when your project grows beyond 100 lines of code. SRP is easy if you're satisfied with single method classes or decide to think about responsibility exclusively in terms of methods. In my opinion, neither of these are suitable options.

<a href="/archives/2012-01-24-the-right-way-to-code-dci-in-ruby/" target="_blank">DCI</a> provides more robust guidelines for following SRP, but we need to redefine responsibility. That's the focus of this article.

# Identity and Responsibility

OK, let's try to elucidate responsibility, but first, let's talk about object orientation.

The word "object" can be defined as a resource that contains state, behavior and identity. Its state is the value of the class's attributes. Its behavior is the actions it can perform. And its identity is...well...it's object id? It feels strange to narrow the definition of identity into a mere number. I certainly don't identify myself by my social security number. My identity is derived from my name, the things I enjoy doing, and potentially my environment. More importantly, my identity is always changing.

While building a class, when was the last time you thought about the forthcoming object ids of the instances of that class? I hope never. We don't program classes with identity in mind, yet if we're trying to model the world, it's an intrinsic component. Identity means nothing to us while building classes, yet everything to us in the real world.

Therefore, it's appropriate to say that the *mental model* of the programmer is to map identity to state and behavior, rather than to object id. Object id is a quality of uniqueness.

Identity is closely related to responsibility. As expressed above, I don't identify by my social security number, but by my state and behavior. When we attempt to find the appropriate location for a method definition, we look at the responsibility of the prospective classes. "Does this method fit into this class's single responsibility?" If we consider that identity should truly be a representation of an object's state and behavior, we can deduce that identity is a *derivative* of responsibility.

An example of this observation is polymorphism; probably the most predominant and powerful object-oriented technique. When we consider the possible duck-typed objects in a scenario, we don't think, "this object will work if its object id is within the following set..." We think "this object will work if it responds to the right methods." We rarely care about the object id. What's important is the true identity of an object: the methods it responds to.

# DCI Roles

Object ids mean nothing to programmers. Defining identity by the memory location of an object is very rarely a means for writing effective software. Computers care about memory locations, not programmers. Programmers care about state and behavior, hence, the reason we build classes.

SRP is about acutely defining state and behavior, thus, identity. In DCI, we define state through data objects and behavior through roles. Generally speaking, behavior changes state so the primary focus is on behavior. If we ask, "what can an object do?", we can subsequently ask, "how does its state change?"

We still haven't really defined responsibility. As a human being, my responsibilities change on a regular basis. At one point, I'm responsible for writing an email. At another, I'm responsible for mentoring a developer. Rarely, although occasionally, am I responsible for doing both. Enter role-based programming.

We can reprogram the example class above using DCI data objects and roles:

```ruby
# Data
class User < ActiveRecord::Base; end

# Roles
module Customer
  def check_in(location); ... end
end

module Searcher
  def solr_search(term); ... end
end

module SocialButterfly
  def request_friendship(other_user); ... end
end
```

Now, each role has a single responsibility. If we define responsibility by a role played by a data object, it becomes obvious where new methods should go and when you're breaking responsibility. Let's give it a shot.

Say we want to add functionality that allows users to accept a requested friendship. First ask the question in terms of business objectives, "As a *social butterfly*, can I *accept a friendship*?" By converting our expectations into English, we can then easily map business rules to code. It would clearly be wrong if we ask, "As a searcher, can I accept a friendship?" Therefore, `#accept_friendship` should belong in `SocialButterfly`:

```ruby
module SocialButterfly
  def request_friendship(other_user); ... end
  def accept_friendship(other_user); ... end
end
```

By defining responsibility as a role, we can converge on contextual identity, the true essence of object orientation. While building a role, we are building identity, a crucial part of a programmer's mental model. Roles are the inverse abstraction of classes. While classes focus on abstracting away identity, roles focus on highlighting it. It's no wonder it's so difficult to define responsibility when we're programming classes, not object.

# DCI and SRP

It's hard to define responsibility. It's even harder to program for it. As an artifact, the responsibility of a class often ends up being either too narrowly or too broadly defined. Define responsibility too narrowly, and it's daunting to wrap your head around 1000 classes. Define responsibility too broadly, and it's arduous to maintain and refactor.

By defining responsibility as a role, we have a clear notion of behavioral locality. We can ask questions like, "as a *customer*, can I *add an item to my cart*?" If the answer is yes and we've appropriately named our roles, the method belongs in that role. This gives us a means for defining responsibility, and we can refactor accordingly.

Roles won't alleviate potential clutter, but they can give us a structure for defining responsibility. With DCI, we can talk about responsibility in terms of directive process instead of contrived examples.

First, understand the business objectives of the system and subsequently understand the roles. Understand the roles and subsequently understand the responsibilities.

*6 comments*