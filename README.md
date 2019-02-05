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
* Adding things dynamically onto a prototype? Don't do that, please. It's impossible to optimize.

## But wait, maybe I want some of those features for legacy support or something.

So you've got code you don't want to write in BlazingScript? No problem: call it as if it was normal JavaScript and everything will magically work. BlazingScript makes the border to JS seamless. [1] 

This is just another reason why coding in TypeScript is such a big advantage: you can use the entire web ecosystem with no external definitions and no data conversion across language barriers. 

[1]: Alright, this doesn't work quite yet. But it could, and that's the whole point! :grin: 

## What's the difference between BlazingScript and [AssemblyScript](https://github.com/AssemblyScript/assemblyscript)? 

AssemblyScript is super cool! But we think the two projects are pretty different. 

The goal of AssemblyScript appears to be to write code which is very close to WASM, which looks mostly similar to TypeScript. However, AssemblyScript's close-to-the-metal approach sacrifices some TypeScript ergonomics that we really like, since there is a very close mapping from AS to WASM.

The goal of BlazingScript is to *use all the good features of TypeScript*. We want flexible object literals, potentially nullable everything, discriminated union types - all that stuff that makes TypeScript such a joy to use. Our goal is to type idiomatic TS and have fast code pop out.

## Enough talking, show me some cool charts

Well, if you say so.

### Reference

| Icon | Meaning |
|----------|---------|
| :white_check_mark:    | Implemented | 
| :black_square_button: | Planned |
| :wavy_dash:           | Deprioritized - open an issue if you want this. |
| :x:                   | Will not be implemented - nonstandard or deprecated API | 
| :arrow_down:          | Will not be implemented - nonidiomatic TS or could cause performance issues |


### Strings 

| Progress | Feature | Notes |
|----------|---------|-------|
| :white_check_mark: | String literals | 
| :white_check_mark: | String equality with `===` | 
| :black_square_button: | Concatenate strings with `+` | 
| :white_check_mark: | String.fromCharCode()
| :wavy_dash:        | String.fromCodePoint()
| :x: | String.prototype.anchor()
| :x: | String.prototype.big()
| :x: | String.prototype.blink()
| :x: | String.prototype.bold()
| :white_check_mark: | String.prototype.charAt()
| :white_check_mark: | String.prototype.charCodeAt()
| :wavy_dash: | String.prototype.codePointAt()
| :black_square_button: | String.prototype.concat() |
| :black_square_button: | String.prototype.endsWith()
| :x: | String.prototype.fixed()
| :x: | String.prototype.fontcolor()
| :x: | String.prototype.fontsize()
| :black_square_button: | String.prototype.includes()
| :white_check_mark: | String.prototype.indexOf()
| :x: | String.prototype.italics()
| :black_square_button: | String.prototype.lastIndexOf()
| :x: | String.prototype.link()
| :wavy_dash: | String.prototype.localeCompare()
| :wavy_dash: | String.prototype.match()
| :wavy_dash: | String.prototype.normalize()
| :black_square_button: | String.prototype.padEnd()
| :black_square_button: | String.prototype.padStart()
| :x: | String.prototype.quote()
| :black_square_button: | String.prototype.repeat()
| :black_square_button: | String.prototype.replace()
| :black_square_button: | String.prototype.search()
| :black_square_button: | String.prototype.slice()
| :x: | String.prototype.small()
| :black_square_button: | String.prototype.split()
| :black_square_button: | String.prototype.startsWith()
| :x: | String.prototype.strike()
| :x: | String.prototype.sub()
| :x: | String.prototype.substr()
| :black_square_button: | String.prototype.substring()
| :x: | String.prototype.sup()
| :wavy_dash: | String.prototype.toLocaleLowerCase()
| :wavy_dash: | String.prototype.toLocaleUpperCase()
| :black_square_button: | String.prototype.toLowerCase()
| :wavy_dash: | String.prototype.toSource()
| :black_square_button: | String.prototype.toString()
| :black_square_button: | String.prototype.toUpperCase()
| :black_square_button: | String.prototype.trim()
| :black_square_button: | String.prototype.trimEnd()
| :black_square_button: | String.prototype.trimStart()
| :black_square_button: | String.prototype.valueOf()
| :black_square_button: | String.prototype[@@iterator]()
| :wavy_dash: | String.raw()

### Array

Properties

| Progress | Feature | Notes |
|----------|---------|-------|
| :white_check_mark:    | Array.length             |
| :arrow_down:          | Array.prototype                |
| :arrow_down:          | Array.prototype[@@unscopables] | We will not support `with` |

Methods

| Progress | Feature | Notes |
|----------|---------|-------|
| :black_square_button: | Array.from()
| :black_square_button: | Array.isArray()
| :x:                   | Array.observe()
| :black_square_button: | Array.of()
| :white_check_mark:    | Array.prototype.concat() |  Needs var-arg support |
| :black_square_button: | Array.prototype.copyWithin()
| :black_square_button: | Array.prototype.entries()
| :black_square_button: | Array.prototype.every()
| :black_square_button: | Array.prototype.fill()
| :black_square_button: | Array.prototype.filter()
| :black_square_button: | Array.prototype.find()
| :black_square_button: | Array.prototype.findIndex()
| :black_square_button: | Array.prototype.flat()
| :black_square_button: | Array.prototype.flatMap()
| :black_square_button: | Array.prototype.forEach()
| :black_square_button: | Array.prototype.includes()
| :white_check_mark:    | Array.prototype.indexOf()
| :black_square_button: | Array.prototype.join()
| :black_square_button: | Array.prototype.keys()
| :black_square_button: | Array.prototype.lastIndexOf()
| :white_check_mark:    | Array.prototype.map() | needs to pass in index and current value
| :black_square_button: | Array.prototype.pop()
| :white_check_mark:    | Array.prototype.push()
| :black_square_button: | Array.prototype.reduce()
| :black_square_button: | Array.prototype.reduceRight()
| :white_check_mark:    | Array.prototype.reverse()
| :black_square_button: | Array.prototype.shift()
| :black_square_button: | Array.prototype.slice()
| :black_square_button: | Array.prototype.some()
| :black_square_button: | Array.prototype.sort()
| :black_square_button: | Array.prototype.splice()
| :black_square_button: | Array.prototype.toLocaleString()
| :black_square_button: | Array.prototype.toSource()
| :black_square_button: | Array.prototype.toString()
| :black_square_button: | Array.prototype.unshift()
| :black_square_button: | Array.prototype.values()
| :black_square_button: | Array.prototype[@@iterator]()
| :arrow_down:          | Array.unobserve()
| :black_square_button: | get Array[@@species]
