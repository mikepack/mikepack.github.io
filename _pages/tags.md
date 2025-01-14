---
layout: single
title: Tags
permalink: /tags/
author_profile: true
classes: wide
page_css:
  - /assets/css/tags.css
page_js:
  - /assets/javascript/tags.js
---

{% assign combinedPosts = site.archives | concat: site.posts | reverse %}
{% assign sortedTags = combinedPosts | map: 'tags' | join: ',' | split: ',' | uniq | sort %}

<div class="tags-list">
  {% for tagName in sortedTags %}
  <div class="tag-group" id="{{ tagName }}">
    <h2>#{{ tagName }}</h2>
    <ul>
      {% for post in combinedPosts %}
      {% if post.tags contains tagName %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <small>{{ post.date | date: "%B %d, %Y" }}</small>
      </li>
      {% endif %}
      {% endfor %}
    </ul>
  </div>
  {% endfor %}
</div>