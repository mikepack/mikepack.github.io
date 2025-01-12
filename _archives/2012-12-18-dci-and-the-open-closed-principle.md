---
title: "DCI and the Open/Closed Principle"
date: 2012-12-18
categories:
  - Archive
tags:
  - dci
  - oop
  - solid
  - ocp
---

The open/closed principle (OCP) is a fundamental "run of thumb" in object-oriented languages. It has hands in proper inheritance, polymorphism, and encapsulation amongst other core properties of object-oriented programming.

The open/closed principle says that we should refine classes to the point at which we eliminate churn. In other words, the less times we need to open a file for modification, the better. With <a href="/archives/2012-01-24-the-right-way-to-code-dci-in-ruby/" target="_blank">DCI</a>, we can compose objects while still following OCP.

## Extension is Inheritance

Wikipedia's definition of inheritance:

> Inheritance is a way to reuse code of existing objects, or to establish a subtype from an existing object, or both, depending upon programming language support.

By using `#extend` to modify objects at runtime, we are both reusing code from data objects while also forming a new subtype of the data object.

A typical DCI *context* might look like this:

**app/use_cases/customer_purchases_book.rb**

```ruby
customer = User.find(1) # customer is a data object
customer.extend(Customer) # inject the Customer role
customer.purchase(book) # invoke Customer#purchase
```

After calling `#extend`, the `user` object can be used as both a data object and a purchasing customer. The `#purchase` method likely uses attributes of the `user` object to create joins between him and his book. We're reusing code from its former self.

Similarly, the new object is now a subtype of its former self. That is, the Customer version of `user` can be used polymorphically in place of the data object itself.

## The Open/Closed Principle (OCP)

The open/closed principle is often discussed in the context of inheritance; we use inheritance to adhere to the "closed" aspect of OCP. In order to follow OCP, a class can be open for extension, but closed for modification. Let's look at how the principle could be applied with classical inheritance to reimplement the above scenario.

We have a dumb data object:

```ruby
class User
  # A dumb data object
end
```

To abide by the "closed" aspect of OCP, we define a subtype of the `User` class; we do not modify the class itself:

```ruby
class Customer < User
  def purchase(book)
    # Update the system to record purchase
  end
end
```

Somewhere else in our codebase, we tell a user to purchase his book:

```ruby
customer = Customer.new
customer.purchase(book)
```

This is great, we've accomplished OCP by ensuring that any customer related aspects of a `User` are neatly tucked away in the `Customer` class. In order to change the behavior of a user, we formed a new class while leaving the `User` class alone.

This is the guts of the open/closed principle. We want to structure our classes in such a way as to ensure they never need to change. Guaranteeing the classes don't change is also a function of the method bodies.

## DCI and OCP

Following OCP without incorporating the Data, Context and Interaction architecture has proven to lead to looser coupling, stronger encapsulation, and higher cohesion. Just apply it and your world will be rainbows and ponies!

Wrong. While OCP has absolutely helped in producing higher quality code, it's just another lofty object oriented principle. It's very difficult to adhere to all principles, and some may be entirely inappropriate in various scenarios. The SOLID principles (of which OCP is one) are a great frame-of-reference when discussing software design, however, heeding to them 100% of the time is frankly, impossible.

I often find it very difficult to ensure the first iteration of my core software, test suite, and ancillary code meet the qualifications of the SOLID principles. Not because I don't understand or refuse to apply them, but because I'm human and I'm working with frequently-varying business rules. Principles in general end up being this pie-in-the-sky goal; I prefer to just write software.

One of the reasons I love DCI so much is because it forces you to work in an orthogonal way. It breaks the cemented programming models we've seen for over 20 years. Models which, in my opinion, do not lend themselves towards these principles. DCI acts much like a lighthouse: guiding you towards proper object orientation.

DCI enables you to automatically apply many best practice principles in object oriented programming. The open/closed principle is one.

### Closed for Modification

The whole point of DCI is to decouple what changes from what remains constant. In DCI, our data objects are strictly persistence related, and as such, do not change frequently. The way in which we use data objects is often what changes.

So, when we build out a data object...

**app/models/user.rb**

```ruby
class User < ActiveRecord::Base
  # A dumb data object
end
```

...it's closed for business.

DCI tells us that if we want to add behavior to this class, we should be doing so within a *role*. A deliberate effect of this is that our class remains closed. OCP is telling us to optimize our classes so that we never need to modify them. This aspect of OCP is baked into the core of DCI.

### Open for Extension

The name says everything. The best way to accomplish DCI in Ruby is to use `#extend`. We seek to inject roles into objects at runtime to accomplish our behavioral needs. Let's create our Customer role:

**app/roles/customer.rb**

```ruby
module Customer
  def purchase(book)
    # Update the system to record purchase
  end
end
```

We would then join our data and roles within a context:

**app/use_cases/customer_purchases_book.rb**

```ruby
class CustomerPurchasesBook
  def initialize(user, book)
    @customer, @book = user, book
    @customer.extend(Customer)
  end

  def call
    @customer.purchase(@book)
  end
end
```

The open/closed principle states that a class should be open for extension. Within the above context, we extend our `user` object with the `Customer` role. Our DCI code adheres to this rule.

OCP talks a lot about extension of classes via inheritance. Demonstrations of OCP are usually forged with classes, instead of objects. In the above paragraph, I say that *classes* are open for extension, but the user *object* is extended. When we define a class, it's simply a container in which methods live. That container then becomes part of an object's lookup hierarchy. So, behaviorally speaking, there's no semantic difference between composing an object from scratch with DCI and creating an instance of a class.

In the customer example above, we use `#extend` as a means of composing the customer object to include its necessary behavior. We do this in lieu of classical inheritance. As I mentioned earlier in this article, extension is inheritance.

## The Silver Bullet

By applying DCI, you are ever-so-nicely nudged into following OCP. DCI is a paradigm shift, but it's coated with reward. By simply working in objects and extending them at runtime, you are guided towards many well-respected, object-oriented principles. The strong emphasis DCI puts on decoupling static classes from dynamic behavior means that your classes remain closed for modification.

DCI contexts are naturally built for OCP. Use cases rarely change. If a user is buying a book, the use case of that purchase remains relatively constant. Since contexts act as simple glue between data and roles, if a use case changes, it's likely to be a new context. In this regard, contexts remain closed for modification.

DCI won't help you properly construct your roles, but it does guide you in the right direction. Since roles are actor-based, their methods tend to be use case specific. This means that role methods don't need to accomodate for drastic variations. If variation increases, I tend to reach for service objects to abstract that complexity.

There is no silver bullet to following object-oriented principles. We're always making tradeoffs. Managing complexity is inherently complex. DCI can help you cope by ensuring your objects remain open for extension, yet closed for modification.

*0 comments*