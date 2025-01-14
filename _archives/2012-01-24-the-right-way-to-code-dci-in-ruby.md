---
title: "The Right Way to Code DCI in Ruby"
date: 2012-01-24
categories:
  - Archive
tags:
  - architecture
  - rails
  - ruby
  - dci
  - testing
  - design-patterns
  - bdd
---

Many articles found in the Ruby community largely oversimplify the use of DCI. These articles, including <a href="/archives/2012-01-17-benchmarking-dci-in-ruby/" target="_blank">my own</a>, highlight how DCI injects Roles into objects at runtime, the essence of the DCI architecture. Many posts regard DCI in the following way:

```ruby
class User; end # Data
module Runner # Role
  def run
    ...
  end
end

user = User.new # Context
user.extend Runner
user.run
```

There are a few flaws with oversimpilfied examples like this. First, it reads "this is how to do DCI". DCI is far more than just extending objects. Second, it highlights `#extend` as the go-to means of adding methods to objects at runtime. In this article, I would like to specifically address the former issue: DCI beyond just extending objects. A followup post will contain a comparison of techniques to inject Roles into objects using `#extend` and otherwise.

## DCI (Data-Context-Interaction)

As stated previously, DCI is about much more than just extending objects at runtime. It's about capturing the end user's mental model and reconstructing that into maintainable code. It's an outside → in approach, similar to BDD, where we regard the user interaction first and the data model second. The outside → in approach is one of the reasons I love the architecture; it fits well into a BDD style, which further promotes testability.

The important thing to know about DCI is that it's about more than just code. It's about process and people. It starts with principles behind Agile and Lean and extends those into code. The real benefit of following DCI is that it plays nicely with Agile and Lean. It's about code maintainability, responding to change, and decoupling what the system *does* (its functionality) from what the system *is* (its data model).

I'll take a behavior-driven approach to implementing DCI within a Rails app, starting with the Interactions and moving to the Data model.

## User Stories

User stories are an important feature of DCI although not distinct to the architecture. They're the starting point of defining what the system does. One of the beauties of starting with user stories is that it fits well into an Agile process. Typically, we'll be given a story which defines our end-user feature. A simplified story might look like the following:

```ruby
"As a user, I want to add a book to my cart."
```

At this point, we have a general idea of the feature we'll be implementing.

*Aside: A more formal implementation of DCI would require turning a user story into a use case. The use case would then provide us with more clarification on the input, output, motivation, roles, etc.*

### Write Some Tests

We should have enough at this point to write an acceptance test for this feature. Let's use <a href="https://github.com/rspec/rspec" target="_blank">RSpec</a> and <a href="https://github.com/jnicklas/capybara" target="_blank">Capybara</a>:

**spec/integration/add_to_cart_spec.rb**

```ruby
describe 'as a user' do
  it 'has a link to add the book to my cart' do
    @book = Book.new(:title => 'Lean Architecture')
    visit book_path(@book)
    page.should have_link('Add To Cart')
  end
end
```

In the spirit of BDD, we've started to identify how our domain model (our Data) will look. We know that Book will contain a *title* attribute. Also in the spirit of DCI, we've identified the Context for which this use case enacts and the Actors which play key parts. The Context is adding a book to the cart. The Actor we've identified is the User.

Realistically, we would add more tests to further cover this feature but the above suits us well for now.

## The "Roles"

Actors play Roles. For this specific feature, we really only have one Actor, the User. The User plays the Role of a customer looking to add an item to their cart. Roles describe the algorithms used to define what the system *does*.

Let's code it up:

**app/roles/customer.rb**

```ruby
module Customer
  def add_to_cart(book)
    self.cart << book
  end
end
```

Creating our Customer Role has helped tease out more information about our Data model, the User. We now know we'll need a `#cart` method on any Data objects which plays the Customer Role.

The Customer role defined above doesn't expose much about what `#cart` is. One design decision I made ahead of time, for the sake of simplicity, is to assume the cart will be stored in the database instead of the sesssion. The `#cart` method defined on any Actor playing the Customer Role should not be an elaborate implementation of a cart. I merely assume a simple association.

Roles also play nicely with polymorphism. The Customer Role could be played by *any* object who responds to the `#cart` method. The Role itself never knows what type of object it will augment, leaving that decision up to the Context.

### Write Some Tests

Let's jump back into testing mode and write some tests around our newly created Role.

**spec/roles/customer_spec.rb**

```ruby
describe Customer do
  let(:user) { User.new }
  let(:book) { Book.new }

  before do
    user.extend Customer
  end

  describe '#add_to_cart' do
    it 'puts the book in the cart' do
      user.add_to_cart(book)
      user.cart.should include(book)
    end
  end
end
```

The above test code also expresses how we will be using this Role, the Customer, within a given Context, adding a book to the cart. This makes the segway into actually writing the Context dead simple.

## The "Context"

In DCI, the Context is the environment for which Data objects execute their Roles. There is always at least one Context for every one user story. Depending on the complexity of the user story, there may be more than one Context, possibly necessitating a story break-down. The goal of the Context is to connect Roles (what the system *does*) to Data objects (what the system *is*).

At this point, we know the Role we'll be using, the Customer, and we have a strong idea about the Data object we'll be augmenting, the User.

Let's code it up:

**app/contexts/add_to_cart_context.rb**

```ruby
class AddToCartContext
  attr_reader :user, :book

  def self.call(user, book)
    AddToCartContext.new(user, book).call
  end

  def initialize(user, book)
    @user, @book = user, book
    @user.extend Customer
  end

  def call
    @user.add_to_cart(@book)
  end
end
```

**Update:** Jim Coplien's implementation of Contexts uses AddToCartContext#execute as the context *trigger*. To support Ruby idioms, procs and lambdas, the examples have been changed to use AddToCartContext#call.

There's a few key points to note:

* A Context is defined as a class. The act of instantiating the class and calling its `#call` method is known as *triggering*.
* Having the class method `AddToCartContext.call` is simply a convenience method to aid in triggering.
* The essence of DCI is in `@user.extend Customer`. Augmenting Data objects with Roles ad hoc is what allows for strong decoupling. There're a million ways to inject Roles into objects, `#extend` being one. In a <a href="/archives/2012-02-08-dci-role-injection-in-ruby/" target="_blank">followup article</a>, I'll address other ways in which this can be accomplished.
* Passing user and book objects to the Context can lead to naming collisions on Role methods. To help alleviate this, it would be acceptable to pass user_id and book_id into the Context and allow the Context to instantiate the associated objects.
* A Context should expose the Actors for which it is enabling. In this case, `attr_reader` is used to expose @user and @book. @book isn't an Actor in this Context, however it's exposed for completeness.
* **Most noteably:** You should rarely have to (impossibly) #unextend a Role from an object. A Data object will usually only play one Role at a time in a given Context. There should only be one Context per use case (emphasis: per use case, not user story). Therefore, we should rarely need to remove functionality or introduce naming collisions. In DCI, it **is** acceptable to inject multiple Roles into an object within a given Context. So the problem of naming collisions still resides but should rarely occur.

### Write Some Tests

I'm generally not a huge proponent of mocking and stubbing but I think it's appropriate in the case of Contexts because we've already tested running code in our Role specs. At this point we're just testing the integration.

**spec/contexts/add_to_cart_context_spec.rb**

```ruby
describe AddToCartContext do
  let(:user) { User.new }
  let(:book) { Book.new }

  it 'adds the book to the users cart' do
    context = AddToCartContext.new(user, book)
    context.user.should_recieve(:add_to_cart).with(context.book)
    context.call
  end
end
```

The main goal of the above code is to make sure we're calling the `#add_to_cart` method with the correct arguments. We do this by setting the expectation that the *user* Actor within the AddToCartContext should have its `#add_to_cart` method called with *book* as an argument.

There's not much more to DCI. We've covered the Interaction between objects and the Context for which they interact. The important code has already been written. The only thing left is the dumb Data.

## The "Data"

Data should be slim. A good rule of thumb is to never define methods on your models. This is not always the case. Better put: "Data object interfaces are simple and minimal: just enough to capture the domain properties, but without operations that are unique to any particular scenario" (Lean Architecture). The Data should really only consist of persistence-level methods, never *how* the persisted data is used. Let's look at the Book model for which we've already teased out the basic attributes.

```ruby
class Book < ActiveRecord::Base
  validates :title, :presence => true
end
```

No methods. Just class-level definitions of persistence, association and data validation. The ways in which Book is used should not be a concern of the Book model. We could write some tests around the model, and we probably should. Testing validations and associations is fairly standard and I won't cover them here.

Keep your Data dumb.

## Fitting Into Rails

There's not a whole lot to be said about fitting the above code into Rails. Simply put, we trigger our Context within the Controller.

**app/controllers/book_controller.rb**

```ruby
class BookController < ApplicationController
  def add_to_cart
    AddToCartContext.call(current_user, Book.find(params[:id]))
  end
end
```

Here's a diagram illustrating how DCI compliments Rails MVC. The Context becomes a gateway between the user interface and the data model.

![MVC + DCI](/assets/images/articles/mvc-dci.jpg)

## What We've Done

The following could warrant its own article, but I want to briefly look at some of the benefits of structuring code with DCI.

* We've highly decoupled the functionality of the system from how the data is actually stored. This gives us the added benefit of compression and easy polymorphism.
* We've created readable code. It's easy to reason about the code both by the filenames and the algorithms within. It's all very well organized. See <a href="http://confreaks.net/videos/759-rubymidwest2011-keynote-architecture-the-lost-years" target="_blank">Uncle Bob's gripe about file-level readability</a>.
* Our Data model, what the system *is*, can remain stable while we progress and refactor Roles, what the system *does*.
* We've come closer to representing the end-user mental model. This is the primary goal of MVC, something that has been skewed over time.

Yes, we're adding yet another layer of complexity. We have to keep track of Contexts and Roles on top of our traditional MVC. Contexts, specifically, exhibit more code. We've introduce a little more overhead. However, with this overhead comes a large degree of prosperity. As a developer or team of developers, it's your descretion on whether these benefits could resolve your business and engineering ailments.

## Final Words

Problems with DCI exist as well. First, it requires a large paradigm shift. It's designed to compliment MVC (Model-View-Controller) so it fits well into Rails but it requires you to move all your code outside the controller and model. As we all know, the Rails community has a fetish for putting code in models and controllers. The paradigm shift is large, something that would require a large refactor for some apps. However, DCI could probably be refactored in on a case-by-case basis allowing apps to gradually shift from "fat models, skinny controllers" to DCI. Second, it <a href="/archives/2012-01-17-benchmarking-dci-in-ruby/" target="_blank">potentially carries performance degradations</a>, due to the fact that objects are extended ad hoc.

The main benefit of DCI in relation to the Ruby community is that it provides a structure for which to discuss maintainable code. There's been a lot of recent discussion in the vein of "'fat models, skinny controllers is bad'; don't put code in your controller OR your model, put it elsewhere." The problem is we're lacking guidance for where our code should live and how it should be structured. We don't want it in the model, we don't want it in the controller, and we certainly don't want it in the view. For most, adhering to these requirements leads to confusion, overengineering, and a general lack of consistency. DCI gives us a blueprint to break the Rails mold and create maintainable, testable, decoupled code.

*Aside: There's been other work in this area. Avdi Grimm has a phenominal book called <a href="http://avdi.org/devblog/2011/11/15/early-access-beta-of-objects-on-rails-now-available-2/" target="_blank">Objects on Rails</a> which proposes alternative solutions.*

Happy architecting!

*Further Reading*

<a href="/archives/2013-03-12-dci-and-the-single-responsibility-principle/" target="_blank">DCI and the Single Responsibility Principle</a><br>
<a href="/archives/2012-12-18-dci-and-the-open-closed-principle/" target="_blank">DCI and the Open/Closed Principle</a><br>
<a href="/archives/2012-08-22-dci-with-ruby-refinements/" target="_blank">DCI With Ruby Refinements</a><br>
<a href="/archives/2012-02-08-dci-role-injection-in-ruby/" target="_blank">DCI Role Injection in Ruby</a><br>
<a href="/archives/2012-01-17-benchmarking-dci-in-ruby/" target="_blank">Benchmarking DCI in Ruby</a><br>

*131 comments*