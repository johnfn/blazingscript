import { BSNode } from "./bsnode";
import { Context } from "../scope/context";
import { Sexpr, S } from "../sexpr";
import { Node } from "typescript";

/**
 * e.g. const x = false
 *                ^^^^^
 */
export class BSFalseKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: Node) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Context): Sexpr {
    return S.Const(0);
  }
}
