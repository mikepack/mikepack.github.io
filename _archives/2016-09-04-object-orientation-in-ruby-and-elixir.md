---
title: "Object Orientation in Ruby and Elixir"
date: 2016-09-04
categories:
  - Archive
tags:
  - ruby
  - elixir
  - oop
  - fp
  - concurrency
  - actors
  - inheritance
  - polymorphism
---

When talking about mainstream programming languages, we often put them into two major buckets: object oriented programming and functional programming. But these programming paradigms are not oil and water. In this article I'll be blending the two to demonstrate a technique in Elixir.

There's been a bit of discussion in the [Erlang](http://www.erlang.org/) and [Elixir](http://elixir-lang.org/) world around this topic. It's recently been stated that Elixir is "[the most object oriented language](http://tech.noredink.com/post/142689001488/the-most-object-oriented-language)." Avdi Grimm has [implemented exercises](http://www.virtuouscode.com/tag/fpoo/) from Brian Marick's [Functional Programming for the Object-Oriented Programmer](https://leanpub.com/fp-oo), originally written in Clojure. There's even a [hilarious library and lightning talk](https://elixirforum.com/t/want-oop-in-elixir/543) from Wojtek Mach for out-of-the-box object orientation in Elixir.

These resources shed light on OOP in Elixir, but they don't demonstrate the building blocks that comprise a working model. In this article, we will build an object system in Elixir from scratch and as bare bones as possible. To do this, all of the Elixir code will be based off Ruby examples. The goal is to highlight some of the core concepts of Elixir and liken them to core concepts of Ruby. (Some familiarity with Elixir is assumed.)

Though we'll build a working model, it's not meant to be an ideal object system nor am I advocating for this style of programming. In fact, the Erlang community relies on [vastly different patterns](http://www.erlangpatterns.org/patterns.html). This is merely an exercise in learning about message passing and state management in Elixir. There are likely several ways to accomplish the same effect and I'd love to hear about other techniques in the comments.

## Primary Concepts in Object Orientation

Object orientated and functional programming have coexisted since the dawn of modern computing. Functional programming originated from mathematics and was naturally conceived first. Object orientation came shortly after with [Simula](https://en.wikipedia.org/wiki/Simula), whose goal was to make state management more straightforward.

Most literature on object orientation rehashes the same core programming concepts: state, behavior and polymorphism. In Ruby, this translates to instance variables, methods, and duck typing. These rudiments can be expanded to other OO concepts, like encapsulation and the [SOLID principles](https://en.wikipedia.org/wiki/SOLID_(object-oriented_design)).

But modern object orientated languages are unnecessarily limiting. It's almost as though they're missing the forest for the trees. The great techniques in object orientation can be written in a functional style, should you want them, while retaining purity and safe concurrency, which we usually want.

## A Basic Object

An object conjoins state and behavior. It encapsulates state internally and exposes behavior externally. Encapsulation is important because it is an effective means of organizing and controlling state. Behavior is the means by which we change state.

Consider the following example of a car in Ruby. The car has a position, x, and the ability to drive forward. When it drives, it increments x by 1.

```ruby
# ruby
class Car
  DEFAULT_ATTRS = {
    x: 0
  }

  def initialize(attrs = {})
    @attrs = DEFAULT_ATTRS.merge(attrs)
  end

  def drive
    old_x = @attrs[:x]
    @attrs[:x] += 1

    puts "[#{self.class.name}] [#{@attrs[:color]}] X .. #{old_x} -> #{@attrs[:x]}"
  end
end
```

Notice in the above class, when `#drive` is called, it prints the name of the class, its color attribute, and the change in the state of x.

The variable `@attrs` is the encapsulated state. The `#drive` method is the behavior. What's beautiful about this class is that once instantiated, we can just call the `#drive` method and we don't have to think about the internal state of `x`. Let's do that now.

```ruby
# ruby
car = Car.new({color: "Red"})
car.drive #=> [Car] [Red] X .. 0 -> 1
car.drive #=> [Car] [Red] X .. 1 -> 2
```

We call `#drive` twice and the internal state of `x` changes. Encapsulation is simple and powerful.

We can write this "class" and this "object" in Elixir. The primary difference is how we encapsulate state and invoke behavior. Instead of encapsulation being a first class citizen like it is in Ruby, we use recursion to represent state. Instead of calling methods like we do in Ruby, we pass a message.

```elixir
# elixir
defmodule Car do
  @default_state %{
    type: "Car",
    x: 0
  }

  def new(state \\ %{}) do
    spawn_link fn ->
      Map.merge(@default_state, state) |> run
    end
  end

  defp run(state) do
    receive do
      :drive ->
        new_x = state.x + 1
        new_state = Map.put(state, :x, new_x)

        IO.puts "[#{state.type}] [#{state.color}] X .. #{state.x} -> #{new_x}"

        run(new_state)
    end
  end
end
```

Let's break this Elixir code down.

The `new/1` function is named "new" to mirror Ruby's `.new` method, but this could be named anything. This function creates a new Elixir process using `spawn_link/1`. We can consider `spawn_link/1` the equivalent to Ruby's special `.new` method. By spawning a new process, we have now created an area to encapsulate state.

If you're not familiar with Elixir processes, you can think of them the same way you think of operating system processes - in fact, [they're modeled after OS processes](http://erlang.org/download/armstrong_thesis_2003.pdf) but are extremely lightweight and [significant faster](http://stackoverflow.com/questions/2708033/technically-why-are-processes-in-erlang-more-efficient-than-os-threads). They run independent of each other, have their own memory space that doesn't bleed, and can fail in isolation.

Inside the newly created process, the default attributes are merged with the attributes passed as an argument. Then, the recursive function `run/1` is called.

```elixir
# elixir
Map.merge(@default_state, state) |> run
```

The `run/1` function is the core of our "object" and the state is recursively passed to `run/1` over and over, encapsulating the state as an argument to the function. When we want to update the state, we call the `run/1` function with the new state.

Let's look more closely at the `run/1` function.

```elixir
# elixir
defp run(state) do
  receive do
    :drive ->
      new_x = state.x + 1
      new_state = Map.put(state, :x, new_x)

      IO.puts "[#{state.type}] [#{state.color}] X .. #{state.x} -> #{new_x}"

      run(new_state)
  end
end
```

One key component of getting this to work is the call to the `receive` function. When `receive` is called, it will block the current process and wait until the process receives a message. Remember, this code is running in a new process all to its own. When a message is passed to the process, it will unblock itself and run the code declared in the proceeding block.

This proceeding block calculates a new state by incrementing `x` into a new variable, updating `x` in the map that represents the state, and then recursively calling the `run/1` function. After calling `run/1` recursively, the process again blocks on `receive`. It continues to recursively do this indefinitely until the `run/1` function decides not to call itself anymore. When we no longer recurse, the process dies and the state is garbage collected. (This non-recursive case is not represented in this code.)

Let's see again what "instantiation" and message passing looks like. The built-in function, `send/2` is used to send a `:drive` message to the process twice.

```elixir
# elixir
car = Car.new(%{color: "Red"})
send(car, :drive) #=> [Car] [Red] X .. 0 -> 1
send(car, :drive) #=> [Car] [Red] X .. 1 -> 2
```

In the above code, calling `Car.new/1` spawns the process and returns a process ID, or "pid." It then sends a message to this pid using `send/2`. `send/2` is in essence the same as calling a method in Ruby. The originator of the term object orientation, Alan Kay, [seems disappointed](http://c2.com/cgi/wiki?AlanKayOnMessaging) that message passing has been displaced by method invocation. The major difference between message passing and method invocation is that message passing is asynchronous - more on that later.

That's our basic object. We have encapsulated state and provided behavior that changes the state. The Ruby version hides state in an instance variable and the Elixir version makes state explicit as a recursive function argument. The Ruby version calls methods, the Elixir version passes messages.

## Inheritance

Beyond state and behavior, inheritance is another core tenet of object oriented programming. Inheritance allows us to extend types (classes) with new state and behavior.

Inheritance is a first class citizen in Ruby, making it easy to categorize state and behavior into subtypes. The following code should be palpable to all Rubyists. This code creates a new `Truck` type as a subtype of `Car` and adds an `#offroad` method only available to trucks.

```ruby
# ruby
class Truck < Car
  def offroad
    puts "Going offroad."
  end
end
```

Since we inherited from the `Car` class, we can call both the `#drive` and the `#offroad` methods on an instance of the `Truck` class.

```ruby
# ruby
truck = Truck.new({color: "Blue"})
truck.drive #=> [Truck] [Blue] X .. 0 -> 1
truck.offroad #=> Going offroad.
```

That's the Ruby version. Elixir doesn't have classes. Inheritance in Elixir is not a first class citizen. It's going to require more setup and ceremony to accomplish.

First, how do we represent types and subtypes without classes? The observant reader would have noticed that upon defining the `Car` module in Elixir, one of the default values was a field named `type` with a value of "Car." In Elixir, classes and types can be represented as plain data, as binaries (strings). The concept of using data to represent types, and not concrete classes like with Ruby, is pervasive in functional programming - take for example [records and tagged tuples](http://erlang.org/doc/programming_examples/records.html).

To model inherited types in Elixir we'll use data to represent the `Car` type and the `Truck` subtype. To mimic the inheritance of behavior (methods) that a subtype derives from a parent type, we'll maintain an instance of `Car` that we delegate message to.

```elixir
# elixir
defmodule Truck do
  def new(state \\ %{}) do
    spawn_link fn ->
      typed_state = Map.merge(%{type: "Truck"}, state)
      parent = Car.new(typed_state)

      Map.merge(%{parent: parent}, typed_state) |> run
    end
  end

  def run(state) do
    receive do
      :offroad ->
        IO.puts "Going offroad."
        run(state)
      message ->
        send(state.parent, message)
        run(state)
    end
  end
end
```

Let's break down the above code.

In the `new/1` function, we're overriding the value of the `type` property and instantiating a new `Car`. This becomes our typed data. We then spawn our parent process.

```elixir
# elixir
typed_state = Map.merge(%{type: "Truck"}, state)
parent = Car.new(typed_state)
```

We need to keep our parent process around so that we can delegate messages when the subtype doesn't directly respond. Then, we call our `run/1` function.

```elixir
# elixir
Map.merge(%{parent: parent}, typed_state) |> run
```

The `run/1` function in the `Truck` module should look familiar. We've added a new `:offroad` message that we respond to. When the `Truck` process receives a message it doesn't understand, it forwards it on to the parent `Car` process.

Let's see how it runs.

```elixir
# elixir
truck = Truck.new(%{color: "Blue"})
send(truck, :drive) #=> [Truck] [Blue] X .. 0 -> 1
send(truck, :offroad) #=> Going offroad.
```

You can see that the `Truck` type has inherited all of the behavior of the `Car` type.

## Polymorphism

Polymorphism is one of object orientation's strongest qualities. It is to programming what [interchangeable parts](http://www.history.com/topics/inventions/interchangeable-parts) is to manufacturing. It allows us to substitute subtypes for their parent type wherever the parent type is used. In addition in Ruby and Elixir, it allows us to substitute *any* type for another type as long as it responds to the right method or message.

Just like inheritance, polymorphism adheres to the [Liskov substitution principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle), a well established characteristic of good object oriented design and part of the SOLID design principles.

First, polymorphism in Ruby. We'll use the `Car` and `Truck` instances to show that they are interchangeable with regards to the `#drive` method. We'll randomly select either instance and call `#drive`.

```ruby
# ruby
car = Car.new({color: "Red"})
truck = Truck.new({color: "Blue"})

[car, truck].sample.drive #=> [Car] [Red] X .. 0 -> 1
                         #=> OR
                         #=> [Truck] [Blue] X .. 0 -> 1
```

The `Array#sample` method will return either a `Car` or a `Truck` instance, but since these are duck typed objects we can successfully call `#drive` on either. If we had another class that didn't inherit from `Car` but also contained a `#drive` method, we could substitute an instance of that class here as well. Polymorphism at its finest.

It's equally as easy in Elixir. Instead of calling methods, we'll pass messages. The only major difference between the Ruby and Elixir version is how we select the random object or process. The rest is virtually identical.

```elixir
# elixir
car = Car.new(%{color: "Red"})
truck = Truck.new(%{color: "Blue"})

Enum.random([car, truck])
  |> send(:drive) #=> [Car] [Red] X .. 0 -> 1
                  #=> OR
                  #=> [Truck] [Blue] X .. 0 -> 1
```

Polymorphism is an inherent part of Elixir, though it's seldom thought of this way. An Elixir process will gladly receive any message you pass it, regardless of whether it can do something with that message. There are no restrictions on which messages can be passed. A phantom message will simply sit in the process's mailbox, and it behooves me to mention that [unhandled messages can cause memory leaks](https://www.safaribooksonline.com/library/view/designing-for-scalability/9781449361556/ch04.html#idm140368413036576).

## Asynchrony

For most intents and purposes, we've built the major components of an object oriented system in a functional language. It has some flaws and doesn't use the most sophisticated Elixir tools, but it showcases that it's possible to represent these patterns in Elixir.

There's one not-so-subtle nuance hidden in these code examples that would rear its head immediately upon actual implementation. Calling methods in Ruby is synchronous and passing messages in Elixir is asynchronous. In other words, calling a Ruby method will pause the program, execute the body of that method, and return the result of that method to the caller. It's a blocking, synchronous activity. Passing a message in Elixir is a non-blocking, asynchronous activity. Elixir will send a process a message and immediately return without waiting for the message to be received.

This can make trivial things in Ruby more cumbersome in Elixir. Take for example simply trying to return a value from a passed message. In Ruby this is straightforward.

```ruby
# ruby
class Car
  def color
    "Red"
  end
end

Car.new.color #=> Red
```

We can do the same thing in Elixir when we're not talking about message passing. Below, we're calling a function that has a return value and everything works as expected.

```elixir
# elixir
defmodule Car do
  def color do
    "Red"
  end
end

Car.color #=> Red
```

But once we start working with processes, this becomes more challenging. Here is an intuitive but broken piece of Elixir code.

```elixir
# elixir
defmodule Car do
  def new do
    spawn_link(&run/0)
  end

  def run do
    receive do
      :color -> "Red"
    end
  end
end

car = Car.new
send(car, :color) #=> :color
```

Did you expect that sending the `car` process a `:color` message would return the value "Red"? Instead, the return value is `:color`. `send/2` returns the message that was sent to a process, not the value that was returned once the message has been handled.

Message passing in Elixir is asynchronous, but if we want to model the synchronous behavior of Ruby's method invocation we'll have to get a little creative.

Since `receive` blocks the process and waits for a message, we can use that in the context of our caller. So, whoever calls `:color` would need to block and wait for a response in order to continue the program, just like Ruby.

Unlike Ruby, there's a bit more ceremony in getting this to work. We'll need to send the caller's pid into the callee. The callee will then send a message back to the caller with the final return value.

```elixir
# elixir
defmodule Car do
  def new do
    spawn_link(&run/0)
  end

  def run do
    receive do
      {:color, caller} ->
        send(caller, {:color, "Red"})
    end
  end
end

car = Car.new
send(car, {:color, self})
receive do
  {:color, response} => response
end #=> Red
```

In the above code, we are passing the caller's pid into the callee, which can be accessed by calling `self/0`. The caller then waits for a message from the callee containing the response. In the caller, the response is pattern matched to extract the value. The return value from the caller's `receive` block is the final response of "Red".

That's a lot of ceremony. Luckily, Elixir has nice abstractions to avoid the litany. Here, we'll look at [Agents](http://elixir-lang.org/getting-started/mix-otp/agent.html). Using Agents, we can treat our code synchronously again and eliminate the low-level `send` and `receive` functions.

```elixir
# elixir
defmodule Car do
  def new do
    {:ok, car} = Agent.start_link fn -> %{color: "Red"} end
    car
  end

  def color(car) do
    Agent.get(car, fn attrs -> attrs.color end)
  end
end

car = Car.new
Car.color(car) #=> Red
```

Elixir has a variety of tools that help keep our code clean while programming synchronously. One such tool is [GenServer.call/3](http://elixir-lang.org/docs/stable/elixir/GenServer.html#call/3). [GenServers](http://elixir-lang.org/docs/stable/elixir/GenServer.html) are a very useful abstraction around processes that allow us to implement state and behavior in a simplified form, much like Ruby.

As a final thought around asynchrony, I'd like to mention two things.

Message passing in Elixir is slower than method invocation in Ruby. This is due to the delay between when the message is sent and when the receiving process handles it.

Message passing in Elixir is the primitive concurrency construct. It's the [actor model](https://en.wikipedia.org/wiki/Actor_model) of concurrency. This is not an option in Ruby unless you're using a library like [Celluloid](https://github.com/celluloid/celluloid). Concurrency in Ruby is usually threaded. The actor model is an abstraction on threads, baked into Elixir, that provides a level of concurrency not attainable in Ruby.

## Wrapping Up

We've blended object orientation and functional programming throughout the course of this article. Whether you prefer the Ruby version or the Elixir version, they both have their place.

Object orientation in Ruby is simple, elegant, and makes me happy. It doesn't provide the concurrency controls that Elixir offers, but the programming model is pleasant to use. On the other hand, Elixir allows us to model a system in an object oriented fashion while leveraging more powerful concurrency controls.

Object orientation in Elixir may or may not be a viable approach. I don't have enough data yet to draw conclusions. It is worth mentioning again that the functional community uses different patterns. The creator of Erlang, Joe Armstrong, has [lamented over OOP](http://www.bluetail.com/~joe/vol1/v1_oo.html){:target="_blank" rel="noopener"} due to the blending of state and behavior, though I find this mixture inevitable with processes. So while it may not be commonplace to use functional languages in an objected oriented style, it's certainly possible and may be more graceful when modeling some domains.

Happy coding!

*8 comments*