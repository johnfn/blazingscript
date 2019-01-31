import { ContinueStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../scope/context";
import { BSNode } from "./bsnode";

// TODO: Handle label.

/**
 * e.g. while (true) { continue; }
 *                     ^^^^^^^^^
 */
export class BSContinueStatement extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Context, node: ContinueStatement) {
    super(ctx, node);
  }

  compile(ctx: Context): Sexpr {
    return ctx.scope.loops.getContinue();
  }
}
