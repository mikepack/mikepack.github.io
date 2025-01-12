---
title: "Don't \"Use\" Protected Methods in Ruby"
date: 2015-05-27
categories:
  - Archive
tags:
  - ruby
  - methods
  - refactoring
---

For years, I didn't understand protected methods. Not because I didn't care to, but because I couldn't see the practicality. I'd been writing what I thought was quality production software and never needed them. Not once. It also didn't help that most explanations of protected methods evoked flashbacks of my worst classes in college when I realized mid-semester I had no idea what was going on. I'm not sure if that was my fault or the professor's.

Definitions of protected usually go like this: "protected methods can be accessed by other classes in the same package as well as by subclasses of its class in a different package." Uh, what?

I picked a particularly obscure definition above, but it was the third hit on <a href="https://google.com" target="_blank">google</a> for "ruby protected methods."

Let's get one thing out of the way early. I'm not saying you shouldn't use protected methods. I'm saying you shouldn't "use" them. As in, deliberately use them with foresight. That's why I put the word in quotes. There are perfectly valid use cases for protected methods, and I'll illuminate one, but this tool should be employed as a refactoring clarification and nothing else.

Let me show you what I mean.

Say we have a `Student` class. Each student has a first name, last name, and the ability to provide their full name. Because knowing strictly a first or a last name is potentially ambiguous, a student only knows how to answer by their full name, so the first and last name are private methods.

```ruby
class Student
  def initialize(first_name, last_name)
    @first_name, @last_name = first_name, last_name
  end

  def name
    first_name + ' ' + last_name
  end

  private

  attr_reader :first_name, :last_name
end
```

Along come the professors and they want to check attendance. They plan to call attendance in alphabetical order by the students' last names. They've asked our company, Good Enough Software LLC, to find a way to sort the students by last name. We promptly tell the professors that we only have access to the students' full names. The professors quickly retort, "don't care, make it good enough."

We got this.

Since we can't call the private method `#last_name`, sorting by last name is a tricky task. We can't just write the following, where a classroom can sort its students:

```ruby
class Classroom
  def initialize(students)
    @students = students
  end

  def alphabetized_students
    @students.sort do |one, two|
      one.last_name <=> two.last_name # BOOM
    end
  end
end
```

Protected methods can't help us here. This code will not work unless the `#last_name` method is made public. We don't want to introduce ambiguity, so we can't make `#last_name` public.

We need to refactor, eventually to protected methods.

This is why I say don't "use" protected methods. Using protected methods during the first iteration of a class is like grabbing your sledgehammer because you heard there would be nails. You show up only to realize the thing you'll be hammering is your grandma's antique birdbox. Inappropriate use of protected methods dilutes the intention of the object's API, damaging its comprehensibility. When reading code that utilizes protected methods, I want to be able to assume there is an explicit need for it; public and private would not suffice. Unfortunately, this is seldom the case.

We should never write new code with protected methods. There's simply not a strong case for it.

But they are helpful here. If we instead compare the two student objects directly with the spaceship operator (`<=>`), then we can let the student objects compare *themselves* using `#last_name`. Since private methods are accessible by the object that owns them, maybe that will work? Let's try.

We want the `Classroom` class to look like the following, comparing student objects instead of the last name of each student.

```ruby
class Classroom
  def initialize(students)
    @students = students
  end

  def alphabetized_students
    students.sort do |one, two|
      one <=> two
    end
  end
end
```

The use of the `#sort` method with a block above is the default behavior, so we can update the the code to eliminate the block:

```ruby
class Classroom
  def initialize(students)
    @students = students
  end

  def alphabetized_students
    students.sort
  end
end
```

We now introduce the spaceship operator on the `Student` class to compare last names of students.

```ruby
class Student
  def initialize(first_name, last_name)
    @first_name, @last_name = first_name, last_name
  end

  def name
    first_name + ' ' + last_name
  end

  def <=>(other) # ← new
    last_name <=> other.last_name
  end

  private

  attr_reader :first_name, :last_name
end
```

This code still won't run. The implicit call to `last_name` works, but the explicit call to `other.last_name` is attempting to call a private method on the `other` student object. Only *now* can protected methods save our metaphorical bacon.

Let's update the `Student` class to make `#last_name` protected. This will allow our spaceship method to call `other.last_name`, because the `other` object is also a `Student`.

```ruby
class Student
  def initialize(first_name, last_name)
    @first_name, @last_name = first_name, last_name
  end

  def name
    first_name + ' ' + last_name
  end

  def <=>(other)
    last_name <=> other.last_name
  end

  protected

  attr_reader :last_name

  private

  attr_reader :first_name
end
```

*Noooow* this code works.

So this is why I say we shouldn't "use" protected methods as a general purpose tool. It's strictly a refactoring clarification for cases where we'd like to provide some utility without exposing additional API to the outside world. In our case, we'd like to compare two students without exposing the `#last_name` method publicly.

Phew, now we have a fighting chance of passing this semester.

*9 comments*