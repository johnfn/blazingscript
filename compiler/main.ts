import ts, { SyntaxKind, parseJsonSourceFileConfigFileContent, FunctionDeclaration, SyntaxList, ParameterDeclaration, Block, Statement, isSwitchStatement, ReturnStatement, Expression, BinaryExpression, Identifier } from 'typescript';
import fs from 'fs'
import { Program } from './program';
import { sexprToString } from './sexpr';

// TODO: double pass: convert to reasonable data structure first, then convert to sexprs
// First pass: 
//   1. convert to reasonable data structure. 
//   2. label all variables so i can use local ?
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
    console.log(x);
    x++;
    console.log(x);

    if (x === 10) {
      clog("It works!")
    } else {
      clog("It doesnt work!")
    }

    /*
    let z = 51;
    console.log(z === 51 ? 111 : 000)

    clog("I was called with")
    console.log(x)
    console.log(y)
    clog("========")
    console.log(55);
    console.log(x - y);
    console.log(3 * 2 + 3);
    clog("hello world!");
    */

    return x * y;
  }
`);

const result = sexprToString(p.parse());
const file = process.argv[2];

if (!file) {
  console.log(`Usage: node ${ process.argv[1] } OUTFILE`);
} else {
  fs.writeFileSync(file, result)
}
