---
title: "Parsing Excel files on Heroku with roo"
date: 2011-08-02
categories:
  - Archive
tags:
  - heroku
  - roo
  - excel
---

When it comes to processing Excel files in Ruby, your options are slim. A quick Google or Github search might reveal <a href="https://github.com/hmcgowan/roo" target="_blank">roo</a>. roo is an interesting beast. It appears that the <a href="http://rubygems.org/gems/roo" target="_blank">RubyGems.org gem</a> file has been taken over and there's some large inconsistencies between the official gem and the Github codebase. The official gem is at version 1.9.5 as of this writing and the Github repo is still stuck at 1.3.11. Don't you hate when that happens?

This guide doesn't involve using the actual roo API, see the <a href="https://github.com/hmcgowan/roo" target="_blank">Github page</a> or <a href="http://roo.rubyforge.org/" target="_blank">rubyforge page</a> for that.

## Getting roo to work on Heroku

Without tweaking, roo doesn't work on Heroku. It makes the (bad) assumption that the file system is writable. Check out <a href="https://github.com/hmcgowan/roo/blob/master/lib/roo/excelx.rb#L85" target="_blank">this line</a> of library to see where the temporary directory gets set. This line assigns a directory within the current working directory as the temporary file store.

On Heroku, that won't be possible. While the roo gem is packed in the dyno, it's directory is read only.

Directly after the linked line is another line that refers to the environment variable ROO_TMP. In version 1.2.0, ROO_TMP was added to alleviate issues where the current directory is inadequate to store temporary files.

To get roo to work on Heroku, create an initializer and set the environment variable to the Rails tmp directory (the only writable directory on Heroku):

`config/initializers/roo.rb`

```
ENV['ROO_TMP'] = "#{RAILS_ROOT}/tmp/"
```

Now, when your app is run either on Heroku or locally, roo will use the Rails tmp directory to store it's files.

Happy rooing!

*9 comments*