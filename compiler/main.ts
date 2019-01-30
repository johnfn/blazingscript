import fs from "fs";
import { Program } from "./program";

// TODO:
// * build up context on the first pass.
//   * dont pop from the context, just move up and down.
// * @offset() for members which are memory offsets.
// * should work out what left hand side expression is. see: decorator.ts
// * better error handling
// * there are still some lingering REMOVE
// * myslocal is a huge hack, remove it!
// * the initial pass to add functions to the file is now entirely unnecessary
// * Figure out some way to write Sexprs better.
// * statements can return null, but expressions cant. lots of stuff can be cleaned up!
// * rename terrible variable names like fd vdl etc etc etc
// * figure out a way to inline constructors
//     this is still hard...
// * THOUGHT: should Sexpr be Sexpr<T> where T is the type? I feel like it could be?
// * put getExpressionNode on BaseNode
//    cant be done, circular dependencies.
// * add imports so that my code isnt such a mess
//   * http://fredkschott.com/post/2014/06/require-and-the-module-system/
// * remove all !
// * rename parseStatementListBS
// * for special functions (like log), we should ensure you actually imported them from somewhere,
//   otherwise you dont get them.
// * assertEquals() rather than just returning true from inside code blocks
// * pushScope and popScope should be a with() sort of thing.
// * eventually eradicate all getText()
// * log:
//   * get correct file name.
//   * pull line number ha!
// * hard stuff
//   * closures
// * rewrite log to use malloc so its not a ticking time bomb!!!!!!! it was overwriting my malloc offset and causing everything to explode.
//    * i think i can do it much better now.
// * use data segment
// * define lib.d.ts for bs
//   * ok... bs is a pretty bad acronym...
// X add simple memory allocator
//   * string allocations need to be declared up front
//   * all temporary variables need to know their type (string, object, etc etc etc)
//   * each block should have a way to declare ahead of time what local variable names its going to need
//     * actually i think a better way would be to request a NUMBER of local variables, so that we can continue to
//       use from the same pile rather than having a ton of unnecessary ones.
// * which gets added to every program
// * figure out how to do simple dispatches on strings, like length
// * generate straight wasm rather than wat

// * fun optimization ideas:
//   * pull out constant expressions that are repeatedly evaluated
//   * inline functions

// TODO: double pass: convert to reasonable data structure first, then convert to sexprs
// First pass:
//   1. convert to reasonable data structure.
//   2. find all
//     1. local variables
//     2. exported functions
// TODO: generate a d.ts file for the exported members of the wasm thing
// TODO: actually check for TS errors n stuff.

// useful to get wat snippets
// https://mbebenita.github.io/WasmExplorer/
// https://blog.scottlogic.com/2018/05/29/transpiling-webassembly.html

// JS unit tests as far as the eye can see.
// https://github.com/v8/v8/tree/master/test/mjsunit

// utility

const p = new Program(`
  function foo() {
    if (true) {
      memwrite(0, 1);
    }

    return memread(0) === 1;
  }
`);

const result = p.parse();
const file = process.argv[2];

if (!file) {
  console.log(`Usage: node ${process.argv[1]} OUTFILE`);
} else {
  fs.writeFileSync(file, result);
}
