import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context, THIS_NAME } from "../program";

export function parseThisKeyword(ctx: Context, pa: ThisExpression): Sexpr {
  return S.GetLocal("i32", "__this");
}
