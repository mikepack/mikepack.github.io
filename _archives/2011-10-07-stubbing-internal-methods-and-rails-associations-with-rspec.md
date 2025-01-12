---
title: "Stubbing Internal Methods and Rails Associations with RSpec"
date: 2011-10-07
categories:
  - Archive
tags:
  - rails
  - rspec
  - stubbing
---

Occasionally, times arise where you would like to unit test the inner workings of a method. As a disclaimer, I don't recommend it because tests should generally be behavior driven. Tests should treat your methods as black boxes; you put something in, you get something out. How it works internally shouldn't really matter. However, if you would like to test the inner workings of your methods there's a number of ways to do so with pure Ruby including `send`, `instance_variable_get` and others. Testing the innards feels dirty no matter which way you spin it but I like to at least do it with RSpec.

## Why Test the Internals?

Lets say you have a method that does some expensive lookup:

```ruby
class Library < ActiveRecord::Base
  include ExpensiveQueries

  att_accessor :books
  def books
    @books ||= expensive_query # The expensive query takes 5 seconds
  end
end
```

The above example should be familiar, you plan to perform something Ruby or database expensive and you would like to cache the result in an instance variable so that all subsequent calls to that method draw from the instance variable.

If you were taking a TDD approach, you wouldn't have this class already written. In that case, you know you'll be performing something very expensive and you want to ensure that method caches the result. How do you test this without knowing the internals of the method?

## Stubbing with RSpec

Let's say you're writing your tests before you write the above class. You could use <a href="https://www.relishapp.com/rspec/rspec-mocks" target="_blank">RSpec's stubbing library</a> to ensure your method is caching it's result.

```ruby
describe Library do
  describe '#books' do
    it 'caches the result' do 
      # Assume some books get associated upon creation
      @library = Library.create!

      # 5 seconds for this call
      the_books = @library.books

      # Stub out the expensive_query method so it raises an error
      @library.stub(:expensive_query) { raise 'Should not execute' }

      # If the value was cached, expensive_query shouldn't be called
      lambda { @library.books }.should_not raise_error
    end
  end
end
```

The key component here is the `@library.stub` call. This is also where we're breaking the black box, behavior driven test idiom. We assume at this line that we know there will be a method call internally named *expensive_query*. This test is also brittle because if *expensive_query* ever changes it's name to *really_expensive_query*, our test will break even though the functionality of our method remains the same.

## Stubbing Rails Associations

What if your *expensive_query* is really an ActiveRecord association? So, let's say your Library class looks more like the following:

```ruby
class Library < ActiveRecord::Base
  has_many books

  att_accessor :authors
  def authors
    @authors ||= books.authors # The expensive query takes 5 seconds
  end
end
```

You could use the nifty <a href="http://apidock.com/rspec/Spec/Mocks/Methods/stub_chain" target="_blank">stub_chain</a> method provided by RSpec to stub the books.authors method and ensure it only gets called once.

```ruby
describe Library do
  describe '#books' do
    it 'caches the result' do 
      # Assume some books and authors get associated upon creation
      @library = Library.create!

      # 5 seconds for this call
      the_authors = @library.authors

      # Stub out the books.authors association so it raises an error
      @library.stub_chain(:books, :authors) { raise 'Should not execute' }

      # If the value was cached, books.authors shouldn't be called
      lambda { @library.authors }.should_not raise_error
    end
  end
end
```

Arguments to *stub_chain* represent the associations used. *stub_chain* could also be used to stub out additional methods which get called within the chain.

Happy stubbing!

*0 comments*