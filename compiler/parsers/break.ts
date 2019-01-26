import { Block, BreakStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";

// TODO: Handle label.

export function parseBreak(ctx: Context, statement: BreakStatement): Sexpr {
  return S("[]", "br", ctx.getLoopBreakLabel());
}
