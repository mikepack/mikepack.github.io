---
title: "Exhibit vs Presenter"
date: 2012-04-30
categories:
  - Archive
tags:
  - exhibit
  - presenter
  - decorator
  - design patterns
---

The exhibit pattern was recently introduced by Avdi Grimm in his book <a href="http://objectsonrails.com/" target="_blank">Objects on Rails</a>. During its introduction, he spent a respectable amount of time laying the foundation for the pattern and discussing how it differs from presenters. While his clarification between the patterns felt succinct and useful, it only piqued my interest. Let's explore these patterns more thoroughly.

## Decorators

Both the exhibit and presenter patterns are a form of the decorator pattern. That is, a (good) implementation of these patterns will delegate any unknown methods to the underlying object it decorates, they'll be transparent. Remaining transparent also means duck-typed objects respond to the same interface. They have a contract with their surrounding objects in terms of naming and type.

There're many ways to define a decorator, we'll use SimpleDelegator here:

```ruby
class Decorator < SimpleDelegator
end

class Car
  def price
    1_000_000
  end
end

car = Car.new
car.price #=> 1000000

decorated_car = Decorator.new(car)
decorated_car.price #=> 1000000
```

In the above code, passing the `car` object into a new Decorator will set up the delegation. Any methods called on an instance of the Decorator will be delegated to the underlying object, the `car`.

The point of this example is to show that a true decorator will delegate any methods it doesn't have defined on itself (in this case `#price`) onto the object it's decorating (the `car`). This is important so that, no matter how many decorators you apply to an object, it will always respond to the same interface.

Building on the previous example, let's look at a less trivial (but still quite trivial) example of decorators:

```ruby
class CarWithHeatedSeats < Decorator
  def price
    super + 5_000
  end
end

car = Car.new
car.price #=> 1000000

car = CarWithHeatedSeats.new(car)
car.price #=> 1005000
```

We've now defined a CarWithHeatedSeats decorator which will add $5,000 to the price of the car. It does so by first calling `#super` and requesting the price of the underlying, delegate, car object. Calling `#price` on the delegate object, car, will return $1,000,000. $5,000 is then added to the price of a normal car and $1,005,000 is the total.

Straightforward, right? Exhibits and presenters are just flavors of decorators.

## Exhibit Pattern

So, exhibits are just decorators. Often with a decorator, you'll want to do more than just forward methods onto the delegate object. You'll likely want to add some additional functionality. Such is the case with exhibits. The additional functionality added will extend (but not disrupt) the delegate object.

**The primary goal of exhibits is to connect a model object with a context for which it's rendered.** This means it's the exhibit's responbility to call the context's rendering method with the model as an argument. In most Rails applications, the "context" will be the view or the controller. For the following examples, we'll create two non-Rails "contexts", a simple text renderer called `TextRenderer` and it's HTML counterpart, `HtmlRenderer`.

The exhibhit could also take the responsibility of attaching metadata to an object. In the following example, we'll attach some additional information about an exhibit which is more akin to the model attributes than how the model is rendered.

A key differentiator between exhibits and presenters is the language they speak. Exhibits shouldn't know about the *language* of the view (eg HTML). Exhibits speak the language of the decorated object. Presenters speak the language of the view.

Let's look at a simple exhibit:

```ruby
class CarWithTwoDoorsExhibit < Decorator
  def initialize(car, context)
    @context = context
    super(car) # Set up delegation
  end

  def additional_info
    "Some cars with 2 doors have a back seat, some don't. Brilliant."
  end

  def render
    @context.render(self)
  end
end

class TextRenderer
  def render(car)
    "A shiny car! #{car.additional_info}"
  end
end

class HtmlRenderer
  def render(car)
    "A <strong>shiny</strong> car! <em>#{car.additional_info}</em>"
  end
end

car = CarWithTwoDoorsExhibit.new(Car.new, TextRenderer.new)
car.render #=> "A shiny car! Some cars with 2 doors have a back seat, some don't. Brilliant."
car.price #=> 1000000

car2 = CarWithTwoDoorsExhibit.new(Car.new, HtmlRenderer.new)
car2.render #=> "A <strong>shiny</strong> car! <em>Some cars with 2 doors have a back seat, some don't. Brilliant.</em>"
```

The purpose of this exhibit is to provide metadata (the `#additional_info` method) as well as call the context's `#render` method (within the `#render` method). We're defining two different "contexts", a text environment and a browser environment. We have two rendering classes, TextRenderer and HtmlRenderer to represent these two contexts. Again, in a normal Rails environment, we'll likely deal with two specific rendering contexts: the controller and the view.

What we're really after with exhibits is polymorphism. Imagine we created a `CarWithFourDoorsExhibit` as well. We want to treat cars with 2 doors and 4 doors the same. We don't care how many doors the car has, as long as it can render itself properly.

Let's look at how we can render both 2 and 4 door cars polymorphically:

```ruby
car = Car.new

exhibit = rand(2) == 1 ? CarWithTwoDoorsExhibit : CarWithFourDoorsExhibit

car = exhibit.new(car, TextRenderer.new)
car.render #=> "A shiny car! ..."
```

To keep things simple, this example uses rand(2) (which will return 0 or 1) to determine the type of exhibit to use. In a real application, the type of exhibit would likely be chosen based on the number of doors on the car. However, we don't really care whether it's a 2 or 4 door car, we just care that it responds to `#render` and can express itself. Depending on the result of rand(2), the result of `car.render` could contain information about 2 door cars or 4 door cars.

Exhibits take heavy advantage of polymorphism.

## Presenter Pattern

Presenters are also decorators. The main different between presenters and exhibits is their proximity to the view. Presenters live very close to the view layer. In fact, they are meant to be a representation of the delegate object within the view.

Avdi touches on this in Objects on Rails, but the intention of presenters has diverged since its incarnation. Presenters were originally formed as a more composite-oriented object where you feed it multiple objects and it renders those objects in their combined state:

```ruby
class AvailabilityPresenter
  def initialize(car, dealer)
    @car, @dealer = car, dealer
  end

  def available?
    dealer.cars_in_stock.include?(car)
  end
end

AvailabilityPresenter.new(Car.new, Dealer.new)
```

Modern day presenters act more like decorators. Typically, they wrap a Rails model and aid in the presentation.

```ruby
class CarPresenter < Decorator
  def description
    if price > 500_000
      "Expensive!"
    else
      "Cheap!"
    end
  end
end

car = CarPresenter.new(Car.new)
car.price #=> 1000000
car.description => "Expensive!"
```

The main goal of presenters is to keep logic out of the view. Its secondary goal is to keep related functionality, which would have previously existed in helpers, in close proximity to the relevant objects. Presenters maintain an object-oriented approach to logic in the view.

If you have conditionals in your views, you'll likely benefit greatly from moving that logic to a presenter.

## Presenter + Exhibit

Presenters and exhibits are not mutually exclusive. We can combine these two concepts to create a presenter which contains view-related logic and knows how to render itself polymorphically.

```ruby
class CarPresenter < Decorator
  def initialize(car)
    exhibit = rand(2) == 1 ? CarWithTwoDoorsExhibit : CarWithFourDoorsExhibit
    super(exhibit.new(car, TextRenderer.new))
  end

  def description
    if price > 500_000
      "Expensive!"
    else
      "Cheap!"
    end
  end
end

car = CarPresenter.new(Car.new)
car.description #=> "Expensive!"
car.render #=> "A shiny car! ..."
```

In this example, we combine presenters and exhibits to take advantage of both. We use presenters as a representation of the object in the view and to deal with any view-related logic. We use exhibits to manage rendering the object.

**Note:** We shouldn't use conditionals in the presenter to derive the correct exhibit. This logic should be extracted into a helper module so all conditionals live in one location. A simplified version of this module might look as follows:

```ruby
module ExhibitHelper
  def self.exhibit(car, context)
    if car.number_of_doors == 2
      CarWithTwoDoorsExhibit.new(car, context)
    else
      CarWithFourDoorsExhibit.new(car, context)
    end
  end
end
```

The refactored CarPresenter would look like this:

```ruby
class CarPresenter < Decorator
  def initialize(car)
    super(ExhibitHelper.exhibit(car, TextRenderer.new))
  end

  def description
    if price > 500_000
      "Expensive!"
    else
      "Cheap!"
    end
  end
end

car = CarPresenter.new(Car.new)
car.description #=> "Expensive!"
car.render #=> "A shiny car! ..."
```

By extracting this logic into a helper, we keep our presenter clean and oriented towards its purpose.

## The Power of Decorators

In the above examples, where presenters and exhibits are used in conjunction, we've demonstrated the true power of decorators. Calling `CarPresenter.new(Car.new)` decorates the new car twice, once with an exhibit and once with a presenter. The beauty, however, is that we can treat the decorated car exactly as we would treat a normal car. Since it's a true decorator (it delegates all unrecognized methods to the delegate object), we can treat it as though it were a car. For instance, the following works:

```ruby
CarPresenter.new(Car.new).price #=> 1000000
```

We can continue to compose the desired car with as many decorations as we'd like:

```ruby
car = Car.new
car.price #=> 1000000

car = CarWithHeatedSeats.new(car)
car.price #=> 100500

car = CarPresenter.new(car)
car.description #=> "Expensive!"
car.render #=> "A shiny 2 door car! ..."
car.price #=> 100500
```

Decorators are a form of object composition. We can fashion complex objects with composition instead of inheritance, often a desired technique. Keep in mind, however, that composition obfuscates the identity of the delegate object. To get composition to work correctly with Rails requires tricking Ruby into thinking the decorated object is, in fact, the underlying delegate object. By default, decorators disguise the delegate object:

```ruby
car = Car.new
car.is_a? Car #=> true
car.kind_of? Car #=> true

car = CarPresenter.new(car)
car.is_a? Car #=> false
car.kind_of? Car #=> false
```

To get decorators to play nice with Rails, a variety of techniques can be applied. BasicObject is a straightforward approach to getting the decorated object to look like the underlying delegate object. [This technique](https://gist.github.com/1522839) permits decorated objects to be used with Rails in places like `#form_for` or anywhere Rails performs some "magic" based on the object's identity (eg routes).

Happy decoration!

*18 comments*