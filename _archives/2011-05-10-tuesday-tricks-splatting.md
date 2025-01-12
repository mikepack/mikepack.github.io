---
title: "Tuesday Tricks - Splatting"
date: 2011-05-10
categories:
  - Archive
tags:
  - tuesday tricks
  - splat
  - ruby
---

In Ruby, the `*` (asterisk) token is often referred to as the "splat operator". It's purpose is to turn a group of arguments into an array. This can be useful if you want to accept an enumeration to your method but don't care how it's formed. For example:

```ruby
def note_tasks(*tasks)
  puts "[ ] #{tasks.join(' and ')}"
end

note_tasks('mow the lawn') #=> [ ] mow the lawn
note_tasks('take out the trash', 'walk the dog') #=> [ ] mow the lawn and walk the dog
note_tasks(['feed yourself', 'get some sleep']) #=> [ ] feed yourself and get some sleep
```

## Splatting in Ruby 1.9

In Ruby 1.8 you were constricted to using the splat operator on the last argument in a method signature. In Ruby 1.9, you can splat anywhere.

```ruby
def note_task(name, *options, stream)
  $stdout = stream
  puts "#{options.first.to_s}#{name}#{options.last.to_s}"
end

note_task('mow the lawn', '[ ] ', 'ignored', '!!', $stdout)
    #=> [ ] mow the lawn!!
```

The above method shouldn't normally be defined in such a way. It would make much more sense to define it with `stream` as the second argument and allow options to be a trailing hash.

```ruby
def note_task(name, stream, options = {})
  $stdout = stream
  puts "#{options[:before].to_s}Make sure you #{name}#{options[:after].to_s}"
end

note_task('mow the lawn', File.new('/dev/null', 'w'), :before => '[ ] ',
                                                      :ignore => 'this',
                                                      :after => '!!')
    #=> [ ] mow the lawn!! (to /dev/null)
note_task('mow the lawn', File.new('/dev/null', 'w'))
    #=> mow the lawn (to /dev/null)
```

Ruby will automatically convert the trailing parameters into a hash. Thanks Ruby.

## This Tuesday's Trick

Splatting is fun and useful, but careful, it can sometimes decrease the integrity of your method signature. Mainly use them when you have a trailing enumerable set that can be passed as a list of arguments.

*0 comments*