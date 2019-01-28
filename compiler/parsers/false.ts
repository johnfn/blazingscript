import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr, S } from "../sexpr";
import { Node } from "typescript";

export class BSFalseKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: Node) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Context): Sexpr {
    return S.Const("i32", 0);
  }
}
