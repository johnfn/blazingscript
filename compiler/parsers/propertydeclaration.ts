import {
  ClassDeclaration,
  MethodDeclaration,
  SyntaxKind,
  CallExpression,
  FunctionDeclaration,
  PropertyDeclaration
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { THIS_NAME } from "../program";
import { parseStatementList } from "./statementlist";
import {
  addDeclarationsToContext,
  addParameterListToContext
} from "./function";
import { assertNever } from "../util";
import { BSNode } from "./bsnode";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";

export class BSPropertyDeclaration extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: PropertyDeclaration) {
    super(ctx, node);

    this.children = [];

    console.log("property declarations are unhandled!");
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Method not implemented.");
  }
}
