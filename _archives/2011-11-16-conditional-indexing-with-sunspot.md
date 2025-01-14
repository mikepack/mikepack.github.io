---
title: "Conditional Indexing with Sunspot"
date: 2011-11-16
categories:
  - Archive
tags:
  - ruby
  - rails
  - sunspot
  - search
  - indexing
  - solr
  - optimization
  - performance
---

One of my favorite new features of <a href="https://github.com/sunspot/sunspot" target="_blank">Sunspot</a> 1.3 is the ability to conditionally index an instance of a model based on anything that returns a boolean.

Say I have a Post model to store my blog posts. We want to index only blog posts which are published so users aren't searching on unpublished posts. The syntax looks as follows:

```ruby
class Post < ActiveRecord::Base
  attr_accessible :title, :content, :published, :external_source

  searchable :if => :published do
    text :title
    text :content
  end
end
```

Pretty nice. But let's elaborate a little. Say we want to index only published posts but we don't want to index posts where content comes from an external source.

```ruby
searchable :if => :published, :unless => :external_source do
  ...
end
```

Let's flip things around. What if want to index only published blog posts which come from external sources? Supply an array.

```ruby
searchable :if => [:published, :external_source] do
  ...
end
```

What if the conditions for indexing are more complex than a simple boolean method on our model? Supply a proc.

```ruby
searchable :if => proc { |post| post.content.size > 0 } do
  ...
end
```

Indexing with sunspot just got a whole lot easier.

Happy indexing!

*14 comments*