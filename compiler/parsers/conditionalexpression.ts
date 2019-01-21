import { ConditionalExpression } from "typescript";
import { Context } from "../program";
import { Sexpr, S } from "../sexpr";
import { parseExpression } from "./expression";

export function parseConditionalExpression(ctx: Context, t: ConditionalExpression): Sexpr {
  // TODO this is wrong because it always evaluates both sides

  return S("i32", "select",
    parseExpression(ctx, t.whenTrue),
    parseExpression(ctx, t.whenFalse),
    parseExpression(ctx, t.condition),
  );
}
