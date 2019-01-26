import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";

export function parseThisKeyword(ctx: Context, pa: ThisExpression): Sexpr {
  return S.GetLocal("i32", "__this");
}
