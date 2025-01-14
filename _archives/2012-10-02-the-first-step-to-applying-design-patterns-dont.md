---
title: "The First Step to Applying Design Patterns: Don't"
date: 2012-10-02
categories:
  - Archive
tags:
  - design-patterns
  - ruby
  - best-practices
  - architecture
  - code-quality
---

Design patterns are awesome. The more we build software with them in mind, the better off we'll be as a community. They can help us elegantly construct solutions which can be readily discussed with peers. They're common solutions to common problems. They're not just common solutions, however. They're battle tested, proven, performant and generally considered "the best" solution. Design patterns are the apotheosis, the epitome, of solution.

In this article, I'll look at varying levels of design pattern application, starting from worse to better, and ultimately landing on what I would consider the utopia of software engineering. The ideas in this article are largely derived from what I've observed, devoted and reasoned about.

## Working from Scratch

Personally, one of the most compelling exercises in software engineering is exploration. Just like in any other engineering field, the problem set expands indefinitely, and thusly, our solution set. As businesses strive to keep a competitive edge, engineers must continue to solve problems which are both new and challenging. Through the process of solving new problems, we manage to come up with some not-so-pleasant-to-work-with solutions. Doing so is natural and healthy and is just about the only way we can continue to improve, especially when first learning. In fact, we're going to create one of those not-so-good solutions right now.

Take, for example, a simple arithmetic problem:

```
1 + 1 = 2
```

Imagine modern programming languages didn't have a + operator. Knowing the result is 2, how would you prove the Left Hand Side (1 + 1)? Well, let's briefly explore one option. For all intents and purposes, the following could be written in pseudocodde. It's not the running code that matters, it's the exploration process which invokes an active mind.

Let's stick to Ruby idioms and define a class, with a method, +:

```ruby
class Fixnum
  def +(other)
    if self.value == 1 and other.value == 1
      2
    end
  end
end
```

Ruby's + oprator aids in this process, but let's call the + method directly:

```ruby
1.+(1) #=> should == 2
```

Nothing tricky going on here. What if we want to evaluate 1 + 2? The most obvious thing is to add some conditional branching to our + method:

```ruby
class Fixnum
  def +(other)
    if self.value == 1 and other.value == 1
      2
    elsif self.value == 1 and other.value == 2
      3
    end
  end
end
```

This is where our solution starts to fall apart. While this would work with a minimal set of operands, as our set grows, our conditional logic grows linearly, if not exponentially. At this point in the exploration process, we probably want to reconsider our solution. It's easy to recognize this first iteration is heading down the wrong path. Given some background in computer science, you might try refactoring this solution to use binary instead.

Feel free to skip the following code, it's not the destination that matters, but the journey by which we got there. Here's our final binary addition code:

```ruby
class BinaryPlus
  def initialize(first, second)
    @first, @second = first, second
    # to_s accepts a base to convert to. In this case, base 2.
    @first_bin  = @first.to_s(2)
    @second_bin = @second.to_s(2)
    normalize
  end

  def +
    carry = '0'
    result_bin = ''

    @max_size.times do |i|
      # We want to work in reverse, from the rightmost bit
      index = @max_size - i - 1
      first_bit, second_bit = @first_bin[index], @second_bin[index]

      if first_bit == '1' and second_bit == '1'
        result_bin << carry
        carry = '1'
      else
        if first_bit == '1' or second_bit == '1'
          if carry == '1'
            result_bin << '0'
            # carry remains 1
          else
            result_bin << '1'
            carry = '0'
          end
        else
          result_bin << carry
          carry = '0'
        end
      end
    end

    # Is there still a carry hangin' around?
    result_bin << '1' if carry == '1'

    result_bin.reverse.to_i(2)
  end

  private

  def normalize
    # We want both binary numbers to have the same length
    @max_size   = @first_bin.size < @second_bin.size ? @second_bin.size : @first_bin.size
    @first_bin  = @first_bin.rjust(@max_size, '0')
    @second_bin = @second_bin.rjust(@max_size, '0')
  end
end
```

For which we would call with:

```ruby
BinaryPlus.new(3, 4).+ #=> should == 7
```

At this point, we've managed to weave our way through a forest of solutions to land on one that doesn't require us to change the code to accommodate new operands. Aside from increasing the maintainability of the code, going through this process has likely taught us a few things about doing basic arithmetic in Ruby:

* The underlying principles are not as simple as the syntax leads us to believe.
* Considering potential operands is likely something we should do before writing code (TDD).
* Ruby has built-in methods for base conversion.
* (The list goes on depending on the explorer.)

This process is both fruitful and enlightening. It's one of beauty and purity. Only by actually solving a problem can we truly say we've conquered it. This is the sensation I seek every day. That of utter accomplishment. This is software engineering, and only through time can be become better at finding maintainable solutions.

There's a catch. I'm not the best problem solver in the world, and neither are you. Individually, we simply can't grasp the vast landscape of problems, much less solve them all enough times that we can confidently say we have the best solution. Collectively, we all strive for the best solutions and combine our results. It's called the Gang of Four, not the Gang of One.

**Aside**: For those interested in the actual source of Fixnum#+, check out the <a href="https://github.com/ruby/ruby/blob/trunk/numeric.c#L2526-2547" target="_blank">Ruby source</a>. Also, <a href="http://www.swarthmore.edu/NatSci/echeeve1/Ref/BinaryMath/BinaryMath.html" target="_blank">more on binary arithmetic</a>.

## Applying Design Patterns

We live in a beautiful age where all problems are already solved. We can thank Leonard Euler, Carl Guass and Isaac Newton for advanced mathematics and forming the foundation of computer science. We can thank Ewald Christian von Kleist, Benjamin Franklin and Alessandro Volta for their work in electricity so we can program on the airplane. We can thank Alan Turing and Donald Knuth for modern computer science and Dennis Ritchie for C. We can thank Matz for Ruby. And we can thank the Gang of Four for design patterns.

Design patterns help us do one thing really well: think and speak in the abstract. Given a problem with input i₁, i₂ and i₃, design patterns can help us elegantly solve such a problem by correct association of i₁, i₂ and i₃. They're generic solutions to generic problems. By its very definition, a (software) pattern is a theme of recurring solutions. The primary benefit of using patterns is we can circumvent a large degree of work. We no longer have to reinvent the "undo" button, the command pattern has already been discussed and documented.

It's very easy to apply design patterns. All you have to do is know they exist. If I know the factory pattern exists and it's a tried-and-true technique of generating objects, all I have to do is research the pattern and follow the steps. With the resources available to us today, we can read about common problems and their resolutions with a single google. There's really no excuse for not applying design patterns at work every day. They can drastically simplify code, increase modularity, increase legibility, decrease duplication, improve translation to English, and the list goes on.

If I had to draw a conclusion right now, I would say "use design patterns." But I don't, so I would rather say something a little more robust.

Design patterns can be extremely helpful in crafting beautiful code, but the way in which they're applied often determines their usefulness. Applying a design pattern in the wrong scenario can push you into a corner, ultimately leading to more disarray than would have been present if it weren't for the design pattern. I'm going to pick on the singleton pattern a bit.

Singletons get a bad rep. In my opinion, rightfully so. Let's look at a situation where "applying a design pattern" can be discouraging.

We only have one file system, right? Naively, I'm thinking, "I know the singleton pattern, that would be a great fit here!" Let's create a file system singleton that writes some text to /dev/null:

```ruby
require 'singleton'

class DevNullSingleton
  include Singleton

  def write(text)
    File.open('/dev/null', 'w') do |file|
      file.write text
    end
  end
end
```

We can use the singleton by referencing its instance:

```ruby
DevNullSingleton.instance.write('Something to dev null')
```

Realistically, this has the same semantics as setting a global constant if we didn't want to use Ruby's singleton library:

```ruby
DEV_NULL = DevNullSingleton.new
# ... later in the code ...
DEV_NULL.write('Something to dev null')
```

So, now our application grows, and we need another file system writer that outputs to /tmp. We're posed with a few options.

We can rename our singleton and allow the #write method to accept a path. The API looks like this:

```ruby
FileSystemSingleton.instance.write('/dev/null', 'Something to dev null')
FileSystemSingleton.instance.write('/tmp', 'Something to tmp')
```

This is bad. If we want to write numerous things to /dev/null, we have a large degree of duplication:

```ruby
FileSystemSingleton.instance.write('/dev/null', 'Something to dev null')
FileSystemSingleton.instance.write('/dev/null', 'Something ele to dev null')
FileSystemSingleton.instance.write('/dev/null', 'Another thing to dev null')
```

Alternatively, we can create a new singleton class that writes to /tmp:

```ruby
class TmpSingleton
  include Singleton

  def write(text)
    # ...
  end
end
```

But now, every time we want to write to a different location on the file system, we need to create a new singleton class. Not great, either.

Probably, the better option is to break ties with the singleton and start instantiating classes normally:

```ruby
class FileSystem
  def initialize(path)
    @path = path
  end

  def write(text)
    File.open(@path, 'w') do |file|
      file.write text
    end
  end
end
```

Now, when we want to write multiple times to /dev/null, we instantiate only once and use it as we would any other class:

```ruby
dev_null = FileSystem.new('/dev/null')
dev_null.write('Something to dev null')
dev_null.write('Something ele to dev null')
dev_null.write('Another thing to dev null')
```

### Here's My Gripe

I don't have anything against the singleton pattern, per se. I have issues with the process by which it's applied. In a number of cases, I've seen design patterns applied in the following steps:

1. Read up on design patterns.
2. Think in terms of design patterns.
3. Apply design patterns.

It's really awesome to read as much as possible, but things start to fall apart around Step 2. If design patterns become the only lens by which you see your software, you'll inevitably end up pigeonholed like the singleton situation above.

Don't name your designs after patterns. This often happens because early in the design process you say, "I can use a singleton here!" So you go about defining classes as you're elaborating the design. Early, it makes sense to name something "FileSystemSingleton" so you can follow the design as it's being built. It acts as a form of documentation. However, it does that, and only that. "FileSystemSingleton" is no more descriptive or expressive than "FileSystem." In fact, it just adds noise. If you name something "BubbleSortStrategy" to denote the strategy pattern, but later compositionally apply subsequent "strategies", is it still technically a strategy? Is it a component of an overall strategy? Drop the "Strategy" and just call it "BubbleSort." That way, no matter whether your design is in fact the strategy pattern, a derivation thereof, or something completely different, it doesn't add clutter or confusion.

Don't design around patterns. Although it would be nice, we can't trust design patterns as the correct solution. For a majority of patterns, I would speculate that only a small amount of problems fit directly in the mold. In the above example, the singleton is not what we ultimately needed. If we hadn't been thinking "singleton, singleton, singleton" early in the design process, we probably wouldn't have ended up with that design. If we had taken a TDD approach to building out the file system writer, we would have likely just ended up with a normal Ruby class, no singletons involved. As software grows and changes, don't get pigeonholed by a design pattern.

## Learning from Design Patterns

In the previous section on **Applying Design Patterns**, I said that all problems have been solved. This is, of course, not true. One of my primary fuel sources is solving problems that neither I've solved nor have I seen solved. That's not to say they haven't been solved, however. My problems are not unique snowflakes. The difference between normal problems and problems which can be readily solved with design patterns is a matter of exposure. We're not exposed to problems for which we've never seen, and therefore we do not readily have a solution. We must compose our own.

When I encounter new problems, I never think in terms of design patterns. I often think in terms of domain. My utopic engineering process consists of a boundless array of knowledge from which I comprise my own solution. I don't rely on one tool, methodology, or process to drive my software. I consume the problem and attempt to make educated decisions. This is the "engineering" part of software engineering. It's not the languages you know, the frameworks you use, or how retina-enabled your computer is. It's your ability to become completely engulfed in a problem, enough to sense its anatomy.

Take, for example, a recent project of mine: <a href="https://github.com/mikepack/pipes" target="_blank">Pipes</a>. Pipes evolved organically through deep discussion around the domain. Why does the probem exist, what are the currently known solutions, and how can we derive the best possible outcome? The question of "what design pattern should we use" never arrose. Design patterns should always be at the forefront of the discussion, however. Some of the architectural motivation was taken from the <a href="http://www.cise.ufl.edu/research/ParallelPatterns/PatternLanguage/AlgorithmStructure/Pipeline.htm" target="_blank">pipeline processing pattern</a>. Studying the pipeline processing pattern evoked new ideas for which to draw transient conclusions. Ultimately, it was the exploration process combined with studying the pipeline processing pattern that lead to a solution I was happy to write home about.

Be a part of the exploration process. Discover how your solution fits into your domain, and your domain into your problem. It's more time consuming than jumping to a cookie-cutter solution, but it's lightyears more glorifying. The exploration process is what leads to interesting and eloquent implementations; ones that can be easily changed, apply to the domain, and have a dash of humanism. No matter how you program, being cognizant of design patterns is always desirable. Learning as much as possible and having varying perspectives is crucial.

Create your own design patterns. Solve problems how you would solve them, not how the Gang of Four solves them. Stay as well-informed as you can on known solutions and reflect on them regularly. Use design patterns as inspiration for better, more applicable solutions to your specific problem. Do not blindly apply them. Think first, then consider design patterns. *This* is software engineering.

*2 comments*