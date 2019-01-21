import ts, { SyntaxKind, FunctionDeclaration, ParameterDeclaration, Block, Statement, ReturnStatement, Expression, BinaryExpression, Identifier, SourceFile, NodeArray, ExpressionStatement, CallExpression, LiteralExpression, VariableStatement, IfStatement, ConditionalExpression, PostfixUnaryExpression, StringLiteral, PrefixUnaryExpression, FlowFlags, ObjectLiteralExpression, AsExpression, ForStatement, VariableDeclaration, VariableDeclarationList, AssignmentExpression, EqualsToken, TypeFlags, NumericLiteral } from 'typescript';
import { Sexpr, Sx, S } from './sexpr';
import { Context } from './program';
import { parseIfStatement } from './parsers/if';
import { parseFunction } from './parsers/function';
import { parseSourceFile } from './parsers/sourcefile';

function assert(x: boolean, msg = "") {
  if (x !== true) {
    throw new Error(msg)
  }
}

export function flatten<T>(x: T[][]): T[] {
  const result: T[] = [];

  for (const a of x) {
    for (const b of a) {
      result.push(b);
    }
  }

  return result;
}

function strnode(node: ts.Node, indent = 0): string {
  return (
    new Array(indent + 1).join(' ') + ts.SyntaxKind[node.kind] + '\n' +
    ts.forEachChild(node, node => strnode(node, indent + 1))
  );
}

function sn(node: ts.Node): string {
  return node.getChildren().map(x => `[${ x.getText() }]`).join(", ")
}

export class Rewriter {
  constructor(
    private root: ts.Node,
    private ctx : Context
  ) {
    this.ctx = ctx;
  }

  parse(): Sexpr {
    return parseSourceFile(this.ctx, this.root as SourceFile);
  }
}