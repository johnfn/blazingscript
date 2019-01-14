import ts, { SyntaxKind, parseJsonSourceFileConfigFileContent, FunctionDeclaration, SyntaxList, ParameterDeclaration, Block, Statement, isSwitchStatement, ReturnStatement, Expression, BinaryExpression, Identifier } from 'typescript';
import fs from 'fs'
import { Program } from './program';
import { sexprToString } from './sexpr';

// TODO: double pass: convert to reasonable data structure first, then convert to sexprs
// TODO: generate a d.ts file for the exported members of the wasm thing

// useful to get wat snippets
// https://mbebenita.github.io/WasmExplorer/
// https://blog.scottlogic.com/2018/05/29/transpiling-webassembly.html

// const emitResolver = typeChecker.getEmitResolver("file.ts")

//emitResolver.writeTypeOfDeclaration(variableDeclarationNode, undefined, undefined, writer)

let indent = 0;

// utility

const p = new Program(`
  function foo(x: number, y: number) {
    console.log(x * y);
    console.log(x - y);
    console.log(5678);
    console.log(5678);
    console.log(5678);

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
