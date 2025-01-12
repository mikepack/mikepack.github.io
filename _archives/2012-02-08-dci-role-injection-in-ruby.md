---
title: "DCI Role Injection in Ruby"
date: 2012-02-08
categories:
  - Archive
tags:
  - delegation
  - forwardable
  - extend
  - architecture
  - dci
---

Injecting Roles into objects in Ruby has been a hot topic in the DCI community. What's the correct approach when augmenting an object at runtime? I want to explore some techniques around getting objects to behave properly. Jim Coplien, a huge proponent behind the DCI architecture, makes a great point:

> "There are a million ways to map object roles to objects, to inject methods into classes, and to make the context available to the methodful object roles."

I want to objectively pose Role injection options with supporting benchmarks. If there's any further techniques outside of those discussed or better ways to accomplish them, I would love to hear them in the comments or by <a href="mailto:mikepackdev@gmail.com" target="_blank">email</a>.

Final disclaimer: Objects should be augmented with Roles in the scope of Contexts as demonstrated in <a href="/archives/2012-01-24-the-right-way-to-code-dci-in-ruby/" target="_blank">The Right Way to Code DCI In Ruby</a>. This article will not express Contexts, but rather focus directly on the Role injection itself.

## The Canonical #extend

This form of Role injection has been used widely. It's the only form of Role injection used by Jim Coplien in his book <a href="http://www.leansoftwarearchitecture.com/" target="_blank">Lean Architecture</a>.

```ruby
data_object.extend RoleWithMethods
data_object.injected_method
```

The concerns around this technique are justified. The primary issue is the inability to `#unextend` the `data_object`. As data objects are passed around numerous Contexts or as they play many Roles in a given Context, we could run into naming collisions between methods in those Roles. Further, if we forget to inject a Role, we could be producing logical errors where our data object contains the necessary method but it belongs to the wrong Role. Take the following example:

```ruby
# Within Context A
data_object.extend RoleWithMethods
data_object.injected_method

# Object enters a different Context
# We forgot to inject the following Role
# data_object.extend RoleWithMethodsTwo
data_object.injected_method #=> Calls injected_method from RoleWithMethods when we expected injected_method from RoleWithMethodsTwo
```

Logical errors aside, naming collisions using `#extend` exist in same form as including modules at class definition. That is, two modules included during class definition could suffer from naming collisions as well. The issues of long-lived objects, naming collisions and logical errors can be further alleviated by passing IDs to the Context class instead of the objects themselves, as demonstrated in <a href="/archives/2012-01-24-the-right-way-to-code-dci-in-ruby/" target="_blank">The Right Way to Code DCI In Ruby</a>. Further, even though methods are overwritten, you'll always invoke the one you're looking for. The invoked method will belong to the most recently `#extend`ed Role.

The other disadvantage of using `#extend` is the way it affects an object's hierarchy. `#extend` <a href="https://gist.github.com/1714241" target="_blank">works similar to inheritance</a>; it injects the Role as a singleton ancestor of the object. Any derivation of the object will then contain the `#extend`ed Role as an ancestor, something that won't occur if you include the module at class definition. `#extend`ing objects could lead to some hard-to-debug instances where it's difficult to track the point at which the Role entered the object's lookup table.

I benchmarked `#extend` in <a href="/archives/2012-01-17-benchmarking-dci-in-ruby/" target="_blank">Benchmarking DCI in Ruby</a> with Ruby 1.9.2. Here's a rerun:

```ruby
         user      system     total      real
extend  8.780000   0.010000   8.790000 (  8.785185)
```

Here's the same benchmark in Ruby 1.9.3:

```ruby
         user      system     total      real
extend  2.370000   0.000000   2.370000 (  2.377565)
```

A significant drop from 1.9.2 to 1.9.3.

## Mixology

This technique uses <a href="https://github.com/dan-manges/mixology" target="_blank">mixology</a>, a library designed to alleviate Ruby's lack of #unextend. The last commit was in 2009 and the library appears to be effectively dead. It works in 1.9.2 but refuses to compile the native extensions in 1.9.3. 1.9.3 incompatibility aside, here's how it's used:

```ruby
data_object.mixin RoleWithMethods
data_object.injected_method
data_object.unmix RoleWithMethods
```

This fits the DCI mold better than `#extend`. It gives the Context the ability to `#unmix` the modules as the Context comes to a close, ideal for managing scope creep as objects move between Roles and potentially Contexts.

I've benchmarked mixology against `#extend`. I include benchmarks with and without `#unmix`. Realistically, the benchmark of focus should be with the use of `#unmix` as it's the core reason for introducing Mixology.

```ruby
                   user      system     total      real
extend          8.710000   0.010000   8.720000 (  8.712797)
mixology w/o unmix  8.670000   0.000000   8.670000 (  8.671777)
mixology w/ unmix  12.570000   0.010000  12.580000 ( 12.567442)
```

It's clear from these benchmarks that Mixology's `#mixin` performs on par with `#extend` in Ruby 1.9.2. However, #unmixing modules incurs a significant performance hit.

## SimpleDelegator, Forwardable, Facades and Wrappers

It's feasible to wrap data objects in wrappers instead of injecting Roles directly. The beauty of doing so is that it encapsulates the object being modified by `#extend`. All behavior and the object itself it isolated within the wrapper. This technique can be demonstrated as follows:

```ruby
class DataObjectDelegator < SimpleDelegator
  def initialize(data_object)
    super data_object.dup.extend(RoleWithMethods)
  end
end

data_object = DataObjectDelegator.new(data_object)
data_object.injected_method
```

The idea is to make the delegator function exactly like a data object without affecting the object itself. In the initializer, we duplicate the object and `#extend` it with our Role. We must duplicate the object (potentially having side effects of its own) so we don't pollute the original object. Without duplication, the original `data_object` would contain the injected Role after the delegator has been removed. Using Forwardable works in a similar fashion to SimpleDelegator.

A more elegant solution is presented by Chris Bottaro called <a href="https://github.com/cjbottaro" target="_blank">schizo</a> which uses facades to wrap the data objects. It isolates the object containing the Role and allows you to act on it within block:

```ruby
data_object.as(RoleWithMethods) do |object_with_role|
  object_with_role.injected_method
end
```

After the block executes, the data_object returns to normal, without the Role injected.

Wrappers can be a nice way to abstract object construction away from the core DCI implementation. They isolate and protect the extended object but they also add yet another layer of complexity. Managing delegators can feel cumbersome in comparision to natively supported `#extend`.

<a href="https://github.com/mikepack/dci_vs_include/blob/master/wrapper_bm.rb" target="_blank">I benchmarked</a> SimpleDelegator, Forwardable and Schizo to see how they perform in Ruby 1.9.2:

```ruby
            user        system    total       real
Delegation  13.100000   0.010000  13.110000 ( 13.099318)
Forwardable 11.770000   0.010000  11.780000 ( 11.772542)
Schizo      52.900000   0.380000  53.280000 ( 53.227285)
```

Not ideal. Each of these performs quite poor compared to native `#extend`, especially in 1.9.3.

Wrappers can also come in the form of Role wrappers. In this instance, the data object would be passed as an argument to Role and the Role would then act on the argument rather than "self". For instance:

```ruby
class RoleWithMethods
  def initialize(data_object)
    @data_object = data_object
  end

  def injected_method
    @data_object.some_data_method
    # Instead of:
    # self.some_data_method
  end
end

RoleWithMethods.new(data_object).injected_method
```

All wrapping techniques suffer from the same problem: **they're not DCI**. Read on to understand why.

## DCI and Object Orientation

A founding concept behind DCI is object-orientation, though, not the object-orientation most of us are used to. Many of us think object-orientation is a means of instantiating classes and calling their methods. However, this is not "true OO". "True OO" involves manipulating objects at runtime. It involves objects with just enough methods to get the job done. Instantiating a modern-day Rails model means we're passing around objects that get the immediate job done *plus* all other jobs the model can perform. Joe Armstrong puts it nicely in <a href="http://codersatwork.com/" target="_blank">Coders at Work</a>:

> "The problem with object-oriented languages is they've got all this implicit environment that they carry around with them. You wanted a banana but what you got was a gorilla holding the banana and the entire jungle."

"True OO" means constructing objects at runtime as needed, not constructing classes and instantiating them to perform a subset of tasks. That's class-oriented programming. "True OO" means capturing the end-user's mental model as objects in memory, akin to Simula and Smalltalk. I'll leave a strong comparison between class-oriented and object-oriented programming to another article.

The reason wrapper techniques can't fall under the DCI umbrella is they're not directly manipulating Data objects. Their duplicating and obfuscating objects to work around Ruby's inability to properly manage object augmentation. Having an `#unextend` method would alleviate the need for wrappers entirely. It really leads to the question: Is Ruby right for DCI? As it stands, the answer is no. Can we use tools and composition to enhance Ruby so it'll perform the functions we need for DCI? Yes, but we're not quite there. Tools in this space need more love, Mixology as a prime example.

Happy injecting!

*24 comments*