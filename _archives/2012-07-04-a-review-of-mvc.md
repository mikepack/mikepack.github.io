---
title: "A Review of MVC"
date: 2012-07-04
categories:
  - Archive
tags:
  - mvc
  - design patterns
---

Recently on the object-composition mailing list, Trygve Reenskaug, creator of MVC and co-creator of DCI, posted a <a href="https://groups.google.com/d/msg/object-composition/4bn32D8KzWc/-DOKxztvNrkJ" target="_blank">short reiteration of the MVC pattern</a>. I'm reposting this here because I find it integral to understanding both historical and present day incarnations of this fundamental design pattern. I find this description succinct and meaningful.

It seems like a new framework is born each and every day, many of which take on the MVC label. The general understanding of MVC is being skewed and the term diluted. This is likely a natural shift in pragmatism, something that shouldn't be demonized. I do feel, however, that we must all understand the underlying principles while discussing these loaded patterns. This post is likely the first of a series, either published here or elsewhere, in which I try to bring clarity to the lexicon we employ daily.

For further reading, I recommend <a href="http://addyosmani.com/blog/" target="_blank">Addy Osmani's articles</a> on design patterns, especially <a href="http://addyosmani.com/blog/digesting-javascript-mvc-pattern-abuse-or-evolution/" target="_blank">Digesting JavaScript MVC - Pattern Abuse Or Evolution</a> and <a href="http://addyosmani.com/resources/essentialjsdesignpatterns/book/#detailmvc" target="_blank">Learning JavaScript Design Patterns - MVC</a>.

---

"I made the a first implementation and wrote the original MVC reports while I was a visiting scientist at Xerox Palo Alto Research Center (PARC) in 1978/79. MVC was created as an obvious solution to the general problem of giving users control over their information as seen from multiple perspectives. (The example problem was to enable a user to work meaningfully with an activity plan for the construction of a ship, actually a supertanker. I brought with me a tape with such a plan. It had some 190 activities AFAICR. It was said that this was the first real industry data to ever enter the halls of PARC. The value of real data was that I couldn't fake the data to suit my solutions.

I don't think the user was explicitly mentioned in the original reports since the user's importance was understood by everyone. Jim [Coplien] thought otherwise, and renamed MVC to MVC-U to make the user an explicit element in the pattern. I'll give a short story to clarify the meaning of the MVC terms.

### Thing

Consider my dog 'Fido'. Fido exists in the real world and eats and plays and grows old and does whatever dogs do. Fido is a thing in the meaning of my first PARC report. Not considered worth its own letter since there is always a real world outside the program. (TMVC? The 'T' is surely superfluous.)

### Model

I've opened the hood of my computer and can assure you that there are no dogs there. What is there is a description of Fido represented as bits within the components of my computer. All of Fido can never be represented, but the description can cover all interesting aspects: A video clip of Fido as a puppy, a snapshot of Fido as a 5-year old dog, his name and sex, his age, color, and weight, etc. I'm not the only person interested in Fido; the vet is interested in his illnesses, his medication history, his x-rays, etc. All these data items are representations of the real things; they make up the Model.

### View

We could imagine that I had a special probe that permitted me to inspect and toggle the individual bits that make up the data of the Model. Not very user friendly, IMO. So we have a program that transforms the model data into a form that I can see with my eyes, understand, and manipulate with my hands. This program is a View. It displays a field that holds Fido's weight, `15kg`. I realize that I have given Fido too much food lately, so I select the '`15`' and type '`19`' over it to signify that Fido is getting fat. The model is changed. A View is both input and output. I'm not interested in everything about Fido; the View is also a filter showing the interesting parts only. The vet's view will be different because his interests are different.

### Controller

May be the vet wants to see two views at the same time; one showing name, sex, age, weight, etc. Another showing his specialties such as illnesses, medication, etc. He needs two views on the screen. They are tightly related since they describe the same dog. The Controller sets up and coordinates one or more Views.

### User

The ultimate master of it all is the user. I did not consider it worth its own letter since there is always a user at the top of the importance hierarchy. MVCU? I considered the 'U' as superfluous as the 'T'. Jim thought otherwise. Apparently, there are people who are so fascinated by programming that the programs are their whole world. They don't remember that a program is without value before it is used by an end user for something valuable. So, regrettably, the 'U' is needed and Jim's MVC-U is the better name."

*2 comments*