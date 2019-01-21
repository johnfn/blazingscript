import fs from 'fs'
import { Context } from './program';

// TODO:
// * add imports so that my code isnt such a mess
// X add simple memory allocator
//   * string allocations need to be declared up front
//   * all temporary variables need to know their type (string, object, etc etc etc)
//   * each block should have a way to declare ahead of time what local variable names its going to need
//     * actually i think a better way would be to request a NUMBER of local variables, so that we can continue to
//       use from the same pile rather than having a ton of unnecessary ones.
// * which gets added to every program
// * figure out how to do simple dispatches on strings, like length

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

// const emitResolver = typeChecker.getEmitResolver("file.ts")

//emitResolver.writeTypeOfDeclaration(variableDeclarationNode, undefined, undefined, writer)

let indent = 0;

// utility

const p = new Context(`
  function foo() {
    if (true) {
      mset(0, 1);
    } 

    return mget(0) === 1;
  }
`);

const result = p.parse();
const file = process.argv[2];

if (!file) {
  console.log(`Usage: node ${ process.argv[1] } OUTFILE`);
} else {
  fs.writeFileSync(file, result)
}
