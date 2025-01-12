---
title: "New/Scope Safe Constructors in OO JavaScript"
date: 2011-05-23
categories:
  - Archive
tags:
  - javascript
  - oo
  - inheritance
---

One frequent problem when developing in Object Oriented JavaScript is how to handle the removal of the `new` keyword when creating an instance of a class. It's often expected that an object should be viably instantiated two ways, with the `new` keyword and without.

```javascript
var part1 = new CarPart('Wheel');
var part2 = CarPart('Axel');
```

With a normal constructor, the above code won't act as expected. Assume our CarPart constructor looks as follows:

```javascript
function CarPart(name) {
  this.name = name;
}
```

Since *this* is bound at runtime, omitting the *new* operator results in a late binding to the *window* object. Late binding in JavaScript is often resolved with the use of closures but can't be in this case. In the case where the *new* operator is omitted, `this.name` is effectively the same as `window.name`.

Creating new/scope safe constructors is very important. If you write a library, for instance, it can't be expected that all users will be familiar enough with OO JavaScript to include the *new* operator. As the creator of a library, a good API results in a certain degree of permission for users to `do what they want`. Constructors are a good example of such a permission.

## How to fix that poor constructor

Our goal is to identify when the constructor was called without the *new* operator and then invoke the constructor properly. Observe the following code.

```javascript
function CarPart(name) {
  if(this instanceof CarPart) {
    this.name = name;
  } else {
    return new CarPart(name);
  }
}
```

In this code, we evaluate if the *this* object is a CarPart and proceed as normal. If the *this* object is not a CarPart (ie, it's a *window* object), call the constructor again, this time with the *new* operator.

Now our constructor works properly with or without the *new* operator.

## But what about inheritance?

Close observers would realize that a child of the CarPart class would not be able to successfully invoke the parent constructor because it assumes the caller is a CarPart. In the following example, our safe constructor (CarPart) will not set the *name* attribute on the Wheel object. It would instantiate a new CarPart.

```javascript
function CarPart(name) {
  if(this instanceof CarPart) {
    this.name = name;
  } else {
    return new CarPart(name);
  }
}

function Wheel(radius) {
  CarPart.call(this, 'Wheel');
  this.radius = radius;
}
```

**Note:** Wheel should be made new/scope safe as well.

In the above example, within the Wheel constructor, CarPart.call is what invokes the parent constructor, known as constructor stealing. When CarPart's constructor is called, `this instanceof CarPart` will fail because *this* is an instance of Wheel.

The solution to this problem lies within the Wheel's prototype. If we set the following after the declaration of Wheel, the inheritance chain is correctly established and `this instanceof CarPart` will return true if *this* is a Wheel.

```javascript
Wheel.prototype = new CarPart();
```

Happy constructing!

*1 comment*