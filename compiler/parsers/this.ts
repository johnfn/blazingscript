import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";

export class BSThisKeyword extends BSNode {
  children: BSNode[];

  constructor(node: ThisExpression) {
    super();

    this.children = [];
  }
}

export function parseThisKeyword(ctx: Context, pa: ThisExpression): Sexpr {
  return S.GetLocal("i32", "__this");
}
