---
title: "Tuesday Tricks - Regex Posix Shortcuts"
date: 2011-06-28
categories:
  - Archive
tags:
  - regex
  - ruby
  - posix
---

Hate typing redundant regular expressions? Me too. How often have you typed the regex `[a-zA-Z0-9]`?

Posix character classes are here to save the day. You can replace `a-zA-Z0-9` with `[:alnum:]`. `[:alnum:]` is the posix character class and there's a whole slew of them at your disposal. Use them in Ruby like so:

```ruby
'-- I have 37 dollars --' =~ /[[:alnum:]]/ #=> 3
'-- I have 37 dollars --' =~ /[[:digit:]]/ #=> 10
'-- I have 37 dollars --' =~ /[[:space:]]/ #=> 2
```

*Note:* An expression with `=~` returns the first position in the string which matches the regex.

Check out the <a href="http://www.regular-expressions.info/posixbrackets.html" target="_blank">full list of posix character classes</a> and determine how you can prettify your expressions.

## This Tuesday's Trick

Posix character classes won't prevent global warming but they sure can help make your regular expressions more readable.

*0 comments*