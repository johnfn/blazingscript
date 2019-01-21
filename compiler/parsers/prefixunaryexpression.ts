import { PrefixUnaryExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseExpression } from "./expression";

export function parsePrefixUnaryExpression(ctx: Context, pue: PrefixUnaryExpression): Sexpr {
  return S(
    "i32",
    "if",
    S("[]", "result", "i32"),
    S("i32", "i32.eq", parseExpression(ctx, pue.operand), S.Const("i32", 0)),
    S.Const("i32", 1),
    S.Const("i32", 0),
  );
}
