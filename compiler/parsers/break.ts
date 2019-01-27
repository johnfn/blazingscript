import { Block, BreakStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";

// TODO: Handle label.

export class BSBreakStatement extends BSNode {
  children: BSNode[] = [];

  constructor(node: BreakStatement) {
    super();
  }
}

export function parseBreak(ctx: Context, statement: BreakStatement): Sexpr {
  return S("[]", "br", ctx.getLoopBreakLabel());
}
