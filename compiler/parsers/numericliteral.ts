import { NumericLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";

export function parseNumericLiteral(ctx: Context, flt: NumericLiteral): Sexpr {
  return S.Const("i32", Number(flt.text));
}
