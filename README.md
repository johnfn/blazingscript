# BlazingScript
> A TypeScript to WASM compiler.

BlazingScript compiles a subset of TypeScript to WebAssembly. 

## Why?

TypeScript is an awesome language. It's highly expressive, the tooling is amazing, and the way it lets you go from a prototype all the way to a production app is amazing. It's got access to the largest module ecosystem in all of programming. There's a reason it's one of the [most loved techologies on StackOverflow](https://insights.stackoverflow.com/survey/2018/). 

*Except.*

TypeScript has two major drawbacks:

1. **It is only as fast as JavaScript.** High performance apps will probably not be written in TypeScript as is. For instance, games will be slower and subject to garbage collection hiccups.

2. **It's has a bunch of JavaScript cruft.** JavaScript is a pretty good language today - it's got destructuring, lambdas, async/await, etc. But it wasn't always great, and TypeScript has to deal with dumb stuff like == vs === and `var` statements in loops not properly being captured by closures. 

### BlazingScript can fix both of these problems!

We fix #1 by compiling to WebAssembly, which is super fast and lets us make our own memory management decisions.

We fix #2 by simply not allowing bad patterns.

* `var` statement? That's an error.
* `==`? Use `===`.
* Using `["foo"]` to dynamically add properties to things you don't own? Nope. Declare them ahead of time, and keep them safe.

## What's the difference between BlazingScript and [AssemblyScript](https://github.com/AssemblyScript/assemblyscript)? 

AssemblyScript is super cool! But the intention of AssemblyScript is to be a thin layer on top of WASM: they don't support things like union types, or optional primitive types, etc. The goal of BlazingScript is to *use all the good features of TypeScript*. We want flexible object literals, potentially nullable everything, discriminated union types - all that stuff that makes TypeScript such a joy to use.
