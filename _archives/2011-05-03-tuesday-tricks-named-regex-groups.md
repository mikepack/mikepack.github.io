---
title: "Tuesday Tricks - Named Regex Groups"
date: 2011-05-03
categories:
  - Archive
tags:
  - tuesday-tricks
  - regex
  - ruby
  - string-manipulation
---

New in Ruby 1.9 is the ability to name capture groups so you don't have to use `$1`, `$2`...`$n`. First a demonstration:

## Ruby Pre-1.9

```ruby
regex = /(\w+),(\w+),(\w+)/
"Mike,Pack,Ruby".match regex
"First Name: #$1"
"Last Name: #$2"
"Favorite Language: #$3"
```

## Ruby 1.9.2

```ruby
regex = /(?<first_name>\w+),(?<last_name>\w+),(?<favorite_language>\w+)/
m = "Mike,Pack,Ruby".match regex
"First Name: #{m[:first_name]}"
"Last Name: #{m[:last_name]}"
"Favorite Language: #{m[:favorite_language]}"
```

**Note**: If you use named groups, Ruby won't process unnammed groups. So the following won't work:

```ruby
regex = /(?<first_name>\w+),(?<last_name>\w+),(?<favorite_language>\w+),(\w+)/
m = "Mike,Pack,Ruby,Colorado".match regex
"First Name: #{m[:first_name]}"
"Last Name: #{m[:last_name]}"
"Favorite Language: #{m[:favorite_language]}"
"Location: #$4"
```

**Note:** Even though Ruby won't populate `$4`, it will still populate `$1`, `$2` and `$3`.

## This Tuesday's Trick

Perl had named regex groups, now Ruby has them. Naming your regex groups can be extremely helpful, especially when the regex becomes complex. Use 'em.

*0 comments*
