import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../scope/context";
import { BSNode } from "./bsnode";

export class BSThisKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: ThisExpression) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Context): Sexpr {
    return S.GetLocal("i32", "__this");
  }
}
