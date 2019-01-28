import ts, {
  SyntaxKind,
  FunctionDeclaration,
  ParameterDeclaration,
  Block,
  Statement,
  ReturnStatement,
  Expression,
  BinaryExpression,
  Identifier,
  NodeArray,
  ExpressionStatement,
  CallExpression,
  LiteralExpression,
  VariableStatement,
  IfStatement,
  ConditionalExpression,
  PostfixUnaryExpression,
  StringLiteral,
  PrefixUnaryExpression,
  FlowFlags,
  ObjectLiteralExpression,
  AsExpression,
  ForStatement,
  VariableDeclaration,
  VariableDeclarationList,
  AssignmentExpression,
  EqualsToken,
  TypeFlags,
  NumericLiteral,
  isSourceFile,
  SourceFile,
  Modifier,
  ModifierFlags,
  ElementAccessExpression,
  PropertyAccessExpression,
  ParenthesizedExpression,
  ThisExpression,
  BreakStatement,
  ContinueStatement,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  ClassDeclaration,
  ClassElement
} from "typescript";
import { BSSourceFile } from "./parsers/sourcefile";

function assert(x: boolean, msg = "") {
  if (x !== true) {
    throw new Error(msg);
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
    new Array(indent + 1).join(" ") +
    ts.SyntaxKind[node.kind] +
    "\n" +
    ts.forEachChild(node, node => strnode(node, indent + 1))
  );
}

function sn(node: ts.Node): string {
  return node
    .getChildren()
    .map(x => `[${x.getText()}]`)
    .join(", ");
}
