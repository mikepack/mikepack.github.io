---
title: "Tuesday Tricks - JavaScript Timer Differentials"
date: 2011-05-17
categories:
  - Archive
tags:
  - tuesday-tricks
  - javascript
  - timers
---

Timers in JavaScript can be either very simple or become very difficult. In most cases, timers are very simple, such as polling a resource to update content on a SPA (Single-Page Application). In this case, you don't really care *when* you get your updates from the server, as long as you get them within, say, 1 second of when you expect to receive a response.

But how about when you need a timer to execute at an exact moment in time (ie: a game)? Well, this isn't possible. The best JavaScript can do is guarantee that your function will be run. It doesn't guarantee that it will be run at a specific time. This is because there could be other processes running when you request your timeout, using `setTimeout`.

When you call `setTimeout` with a 5000 millisecond delay, it may run in exactly 5000 milliseconds and it may not, depending on what is being processed and what is in the queue. If your setTimeout call gets placed in the queue for 50 milliseconds, your function will be run at 5050 milliseconds. The delay is unpredictable. It's a fact of cyber-life.

## Timer Differentials

You can't tell how long your setTimeout call will remain in the queue (and offset your timing), but you can tell how long it remained in the queue after it has been executed. *Be careful, it's only supported by Firefox*.

```javascript
setTimeout(function(diff) {
  if( diff > 0 ) {
    // function was in the queue
  } else if( diff < 0 ) {
    // function was called early
  } else {
    //function was called on time
  }
}, 5000);
```

## This Tuesday's Trick

You probably never develop applications that only run in Firefox, but it's helpful to know that you can make your timing more accurate in the instance the user's browser is Firefox. `setTimeout` differential will help you do just that.

*0 comments*