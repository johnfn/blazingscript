import { BSNode } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { Node } from "typescript";

export class BSTrueKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: Node) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Context): Sexpr {
    return S.Const("i32", 1);
  }
}
