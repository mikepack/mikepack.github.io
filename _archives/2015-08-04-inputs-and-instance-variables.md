---
title: "Inputs and Instance Variables"
date: 2015-08-04
categories:
  - Archive
tags:
  - locality-of-reference
  - ruby
  - antipattern
  - attr_reader
  - oop
  - fp
  - clean-code
---

There's an antipattern I see in a lot of codebases. This antipattern obstructs our vision and makes code more difficult to reason about. It's everywhere, and its name is `attr_reader`.

In order to understand why `attr_reader` can be an antipattern, we need to appreciate that methods, inputs and instance variables are not the same thing. Functional programming has aided in formalizing this antipattern for me, but I've felt it all along.

In the following code, what are `first_name` and `last_name`?

```ruby
def full_name
  first_name + ' ' + last_name
end
```

You can speculate, but you can't be 100% confident. They're definitely methods, but looking strictly at this code, it's unclear where `first_name` and `last_name` are defined. Likely, there are `attr_reader`s somewhere, and they are merely masked for their true values, which are instance variables:

```ruby
def full_name
  @first_name + ' ' + @last_name
end
```

It's difficult to know for sure where the values behind `first_name` and `last_name` come from. They could be caught by `method_missing`, in which case there's probably more complexity to fetching these values than appears on the surface. They could be defined on some entirely different object or contain some bizarre side effects in whatever code serves them. Only once the programmer reading `full_name` has investigated the source of `first_name` and `last_name` can they have confidence in knowing what this code does.

So how can we add clarity? Two forms: inputs and instance variables.

We've already seen the instance variable form of circumventing this antipattern:

```ruby
def full_name
  @first_name + ' ' + @last_name
end
```

This code disambiguates the source of `first_name` and `last_name`. They're instance variables; they come from within this class. There's no arguing, no guessing, they're definitely variables encapsulated within the same object that `full_name` is defined.

We can now look at `full_name` and reason about its proximity to `first_name` and `last_name`. This code improves the spatial locality of `first_name` and `last_name` by reducing the steps we must take to understand `full_name`.

Improving spatial locality reduces the cognitive complexity induced by this method. This is beneficial, especially when picking up new codebases, as it allows the reader to be confident in the code they see. It curtails the number of assumptions they must make about what's going on.

But we can do better than instance variables.

Instance variables improve spatial locality as they inform us that the source of some data is within the context of that class. But it doesn't tell us specifically where the instance variables are defined; we still need to trudge through code within that file. We have a tool that even further improves spatial locality: inputs.

In the following code, we defined `first_name` and `last_name` as parameters to the `full_name` method:

```ruby
def full_name(first_name, last_name)
  first_name + ' ' + last_name
end
```

Now we can look at this code, in isolation, and reason about the source of all data. We know exactly where `first_name` and `last_name` come from.

This is a functional style of programming, and I won't claim that it's always better. It might feel superfluous to have to pass `first_name` and `last_name` into this method in every place the full name was needed. It would make our code more verbose and less expressive. Which would you rather see throughout your codebase: `person.full_name` or `person.full_name(person.first_name, person.last_name)`?

But there is still yet another benefit to passing in arguments. Object oriented programmers might sigh when I say this, but this `full_name` method is now functionally pure. It is functionally pure because at any point, if we call this method with the same `first_name` and `last_name` arguments, we will get the exact same return value every time.

Functionally pure methods are easier to test as they require less setup. Whereas with instance variables, the object state must be correct before evoking the `full_name` method.

I recognize that for some people, using `attr_reader` is a stylistic choice. They prefer to look at the @-less reference to data, so they use `attr_reader` everywhere. I personally don't find @ symbols offensive. Their presence indicates a lot to me.

I do believe that `attr_reader` can be an antipattern, unless the intention is to expose the state of an instance variable to the outside world. We can avoid this antipattern by revealing underlying instance variables, and carefully considering granularity of inputs. Doing so can reduce complexity and dispel the magic of unnecessary abstractions.

Happy coding.

*1 comment*