---
title: "OmniAuth's Overzealous Approach to Facebook Auth"
date: 2011-09-21
categories:
  - Archive
tags:
  - facebook
  - omniauth
  - api
---

Call me a stickler, but I think there should be two pages that load quickest in any web app: The home page (for people not logged in) and the initial page you see once you are logged in, usually the dashboard.

## The Good

Tackling the first of these two criteria, the guest home page, is fairly easy. This page could be as simple or as complex as you want. <a href="http://www.facebook.com/" target="_blank">Facebook</a> keeps it simple and static. <a href="http://www.foursquare.com/" target="_blank">Foursquare</a> adds some flair. Whatever the approach may be, it's pretty easy to control the load time of the guest home page because you're likely building it from scratch.

<a href="https://github.com/intridea/omniauth" target="_blank">OmniAuth</a> had the revolutionary idea to consolidate third party methods of authentication, most using OAuth 1 or 2. But as consumers of libraries which take on such a burden, we have to be extra careful of the intricacies. For OmniAuth, one of those intricacies includes authentication with Facebook.

## The Bad

When OmniAuth successfully authenticates with Facebook, somethings terrible happens: it makes a request to the Facebook Graph API...every...single...time. Not only the first time you log in with Facebook, but all subsequent times. This is because of the vast decoupling between OmniAuth and your app. OmniAuth knows nothing about your underlying data model so it can't reliably store the authenticated user's Facebook information (and know not to request it again). To provide the user's Facebook information within your success callback, OmniAuth <a href="https://github.com/intridea/omniauth/blob/v0.2.6/oa-oauth/lib/omniauth/strategies/facebook.rb#L21" target="_blank">makes a request to the Facebook API</a>.

I think it goes without saying but this is really bad for usability. To glance at a couple problems with this approach, consider that the Graph API is down. Or, consider that it never responds at all. Or, consider that you're over your Facebook API quota. Your users will be sitting in limbo at the most critical time they're using your app, during the login process. Maybe this is their first time logging in. Making one API call could potentially make it their last. Impress users early and with OmniAuth's Facebook integration you could be missing out.

## The Fix

The solution is to roll your own Authentication. <a href="http://developers.facebook.com/docs/reference/javascript/" target="_blank">Facebook's JavaScript SDK</a> is awesome (most of the time) and you could probably integrate it within the same timeframe as you could OmniAuth but with the added benifit of a much better user experience. Unlike similar solutions to the Facebook JS SDK (<a href="https://dev.twitter.com/docs/anywhere/welcome" target="_blank">Twitter @Anywhere</a>), Facebook provides you with everything OmniAuth does, including the API access token.

*Sidenote:* As of this posting, OmniAuth 1.0 is currently under active development and it doesn't look like this issue has leaked into the <a href="https://github.com/igor-alexandrov/oa-facebook" target="_blank">OmniAuth Facebook Extension</a> yet. The official release is still at 0.2.6.

Happy Facebooking!

*0 comments*