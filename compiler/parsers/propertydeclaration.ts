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
import {
} from "./function";
import { BSNode } from "./bsnode";

export class BSPropertyDeclaration extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: PropertyDeclaration) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Method not implemented.");
  }
}