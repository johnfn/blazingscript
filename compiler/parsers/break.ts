import { Block, BreakStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";

// TODO: Handle label.

/**
 * e.g. while (true) { break; }
 *                     ^^^^^
 */
export class BSBreakStatement extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Context, node: BreakStatement) {
    super(ctx, node);
  }

  compile(ctx: Context): Sexpr {
    return S("[]", "br", ctx.getLoopBreakLabel());
  }
}
