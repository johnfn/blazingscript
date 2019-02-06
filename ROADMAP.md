### Reference

| Icon | Meaning |
|----------|---------|
| :white_check_mark:    | Implemented | 
| :black_square_button: | Planned |
| :wavy_dash:           | Deprioritized - open an issue if you want this. |
| :x:                   | Will not be implemented - nonstandard or deprecated API | 
| :arrow_down:          | Will not be implemented - nonidiomatic TS or could cause performance issues |

### Keywords

| Progress | Feature | Notes |
|----------|---------|-------|
| :wavy_dash: | arguments | I can do this, but does anyone want it? |
| :black_square_button: | async | Oh boy
| :white_check_mark: | break | Still need to do labelled breaks |
| :black_square_button: | case | Still need to do labelled breaks |
|:wavy_dash: | catch | See exception handling section below
| :black_square_button: | class | See class section below
| :white_check_mark: | const |
| :white_check_mark: | continue | Still need to do labelled continues
| :wavy_dash: | debugger | Hah! One day... one day...
| :black_square_button: | default |
| :wavy_dash: | delete | not sure if I want to support this for arrays
| :black_square_button: | do |
| :white_check_mark: | else |
| :black_square_button: | export |
| :black_square_button: | extends | See class section below
| :black_square_button: | finally | See exception handling section below
| :white_check_mark: | for |
| :white_check_mark: | function | See function section below
| :white_check_mark: | if |
| :black_square_button: | import |
| :wavy_dash: | in | will not support for...in, except *maybe* on objects.
| :black_square_button: | instanceof |
| :black_square_button: | new |
| :white_check_mark: | return |
| :black_square_button: | super |
| :black_square_button: | switch |
| :white_check_mark: | this |
| :wavy_dash: | throw |
| :wavy_dash: | try |
| :black_square_button: | typeof |
| :x: | var | Use let or const
| :wavy_dash: | void | seems unnecessary, but not hard to add
| :black_square_button: | while |
| :x: | with | Will definitely never add this.
| :black_square_button: | yield | Oh boy.

### Classes

| Progress | Feature | Notes |
|----------|---------|-------|
| :black_square_button: | Implementation | Got some basic stuff in place, but there's still a lot of details to be worked out.
| :black_square_button: | Constructors | 
| :black_square_button: | Properties | 
| :black_square_button: | Methods |
| :black_square_button: | super | 
| :black_square_button: | Static Methods |
| :black_square_button: | Static Properties |
| :black_square_button: | Private modifier | There isn't much to do here since TS will enforce this.
| :black_square_button: | Getters / Setters | 
| :black_square_button: | Inheritance | Oh boy

### Functions

| Progress | Feature | Notes |
|----------|---------|-------|
| :white_check_mark: | Function declarations | 
| :white_check_mark: | Method declarations | 
| :white_check_mark: | Arrow functions | 
| :wavy_dash: | Function expressions | Use arrow functions - it's difficult to ensure `this` is typed correctly. |
| :white_check_mark: | Arrow functions | 
| :black_square_button: | Closures |
| :black_square_button: | Default arguments |
| :black_square_button: | Optional arguments |
| :arrow_down:          | Function.prototype.apply |  Might be possible, need to investigate (https://github.com/Microsoft/TypeScript/pull/27028)[this PR]
| :arrow_down:          | Function.prototype.bind | Might be possible, need to investigate (https://github.com/Microsoft/TypeScript/pull/27028)[this PR]
| :arrow_down:          | Function.prototype.call | Might be possible, need to investigate (https://github.com/Microsoft/TypeScript/pull/27028)[this PR]

### Modules

| Progress | Feature | Notes |
|----------|---------|-------|
| :black_square_button: | Rudimentary module loading and bundling | 

## Standard Library

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
