---
title: "Stubbing CONSTANTS with RSpec"
date: 2012-02-21
categories:
  - Archive
tags:
  - rspec
  - testing
  - stubbing
---

There's not any great info out there about stubbing constants. In fact, you can't stub constants. What you can do is reinitialize them.

The following code is trouble because Ruby complains about reinitializing the constant:

```ruby
it 'changes the constant' do
  MyClass::SOME_CONSTANT = [1,2,3]
  MyClass::SOME_CONSTANT.should == [1,2,3]
end

#=> warning: already initialized constant SOME_CONSTANT
```

The spec passes but I hate the warning message Ruby spits out. So here's how we can prevent this warning and achieve the same result:

```ruby
it 'changes the constant' do
  MyClass.send(:remove_const, 'SOME_CONSTANT')
  MyClass::SOME_CONSTANT = [1,2,3]
  MyClass::SOME_CONSTANT.should == [1,2,3]
end
```

We explicitly remove the constant before reinitializing it. We use `#send` to access `#remove_const` because it's a private method. Happy stubbing!

*3 comments*