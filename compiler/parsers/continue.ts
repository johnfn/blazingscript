import { ContinueStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";

// TODO: Handle label.

export function parseContinue(ctx: Context, statement: ContinueStatement): Sexpr {
  return ctx.getLoopContinue();
}
