---
title: "Getting started with open source: Making my first contribution to Hugo."
date: 2024-12-15
Description: ""
thumbnail: "images/thumbnails/help_me_help_myself.png"
Tags: ["hugo", "open source", "wasm", "MIME"]
draft: true
---

Lot's of people ask for advice on how to get started in open source.

What works for me is to - instead of jumping straight into the code - become a
user first! The chances are high that you either:

1. Run into a problem: A great point to start a discussion on how to fix
documentation, update build requirements for your platform or update broken scripts.
2. Discover a feature is missing for your use-case.

Being a user of the software you are working on, is not only helpful in
open source, but software engineering in general. You need to understand your
users to be able to build a good product, and one of the best ways of doing
so is to be a user yourself. This concept is also known as
["eating your own dog food"](https://en.wikipedia.org/wiki/Eating_your_own_dog_food).

In this post, I will detail my journey from a first time user of Hugo to a
contributor to the project.

## Hugo

When I got frustrated with my previous setup for my personal blog, I looked into Hugo.
[Hugo is one of the most popular open-source static site generators,](https://gohugo.io/)
and it now powers the blog you are currently reading!

I wanted to have a place where I can:
+ Document and share some findings, i.e., [a blog](https://datosh.github.io/),
+ a [reference of my talks](https://datosh.github.io/portfolio/) for future CfPs
+ and a list of my side projects

The last one is where I ran into a bug in Hugo's MIME type handling.

## WASM & goinvaders

Every now and so often, I need to scratch an itch, and do some 2D game programming.
When I learned C++ I dabbled into [glfw](https://github.com/glfw/glfw) and OpenGL,
when I picked up Python I naturally followed some amazing
[pygame](https://github.com/pygame/pygame) tutorials, and for Go we have the
fantastic [ebiten](https://github.com/hajimehoshi/ebiten) 2D game engine.

So I set out to implement a copy of the classic game space invaders in
Go: [goinvaders](https://github.com/datosh/goinvaders). (Why do we have this need
to put the programming language into our project names?!) BTW, credit for the art
and sound go to my [brother](https://github.com/sebe94) and
[wife](https://github.com/eileenkammel), respectively, I couldn't draw a box if my
life dependent on it.

The great thing about
[go](https://go.dev/wiki/WebAssembly) and
[ebiten](https://ebitengine.org/en/documents/webassembly.html)
is the built-in support to specify WASM as the target platform, enabling us to run
games directly in the browser.

Check out [goinvaders' GitHub Action](https://github.com/datosh/goinvaders/blob/master/.github/workflows/goinvaders.yml)
for the (very small) build script.

## Hugo & MIME Types

Multipurpose Internet Mail Extensions (MIME) types are a standard way of
describing the content of data transmitted over the internet. They are hints
for the receiver to know how to handle the data that is received, and take
the form of `type/subtype` strings. See the
[Structure of a MIME Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types#structure_of_a_mime_type) for more details.

In our case, we want to instruct our web browser to download the WASM based
version of goinvaders and run it inside the browser's engine, therefore
the expected MIME type should be `application/wasm`.

Sadly, when we try to serve our game with Hugo and browse to it in Chrome we
get a blank screen and the error:
`Uncaught (in promise) TypeError: Failed to execute 'compile' on 'WebAssembly': Incorrect response MIME type. Expected 'application/wasm'.`

🤔 what's going on here?

Usually when I face browser issues I double check with Firefox, just to be sure
it's not a browser issue. So when we browse to the same location in Firefox we get:
`Uncaught (in promise) TypeError: WebAssembly: Response has unsupported MIME type 'application/wasm; charset=utf-8' expected 'application/wasm'`


## Conclusion

I

1. Please invest in helpful error messages, looking at you Chrome ;)

https://github.com/gohugoio/hugo/pull/12038
