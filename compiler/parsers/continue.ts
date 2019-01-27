import { ContinueStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";

// TODO: Handle label.

export class BSContinueStatement extends BSNode {
  children: BSNode[] = [];

  constructor(node: ContinueStatement) {
    super();
  }
}

export function parseContinue(ctx: Context, statement: ContinueStatement): Sexpr {
  return ctx.getLoopContinue();
}
