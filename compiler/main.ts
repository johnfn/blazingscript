import fs from 'fs'
import { Program } from './program';

// TODO:
// * add simple memory allocator
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

const p = new Program(`
  function foo(x: number, y: number) {
    if (x === 9) {
      clog("if works")
    } else {
      clog("FAIL")
    }

    if (x === 10) {
      clog("FAIL")
    } else {
      clog("if works")
    }

    x++;

    if (x === 10) {
      clog("inc works!")
    } else {
      clog("FAIL")
    }

    console.log(x);

    let z: number;

    if (z === 0) {
      clog("init z to 0!");
    } else {
      clog("FAIL Z");
    }

    let zz = 5;

    if (zz === 5) {
      clog("init zz to 5!");
    } else {
      clog("FAIL ZZ");
    }
    console.log(z);

    /*
    zz = z;

    if (zz === 0) {
      clog("set zz to z!");
    } else {
      clog("FAIL set zz to z");
    }
    */

    return x * y;
  }
`);

const result = p.parse();
const file = process.argv[2];

if (!file) {
  console.log(`Usage: node ${ process.argv[1] } OUTFILE`);
} else {
  fs.writeFileSync(file, result)
}
