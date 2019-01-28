import { ContinueStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";

// TODO: Handle label.

export class BSContinueStatement extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Context, node: ContinueStatement) {
    super(ctx, node);
  }

  compile(ctx: Context): Sexpr {
    return ctx.getLoopContinue();
  }
}
