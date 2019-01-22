import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseExpression } from "./expression";

export function parsePropertyAccess(ctx: Context, pa: PropertyAccessExpression): Sexpr {
  const expType = ctx.typeChecker.getTypeAtLocation(pa.expression);
  const property = pa.name.text;

  if (expType.flags & TypeFlags.StringLike) {
    if (property === "length") {
      return S("i32", "call", "$__strlen", parseExpression(ctx, pa.expression));
    }
  }

  throw new Error("Todo");

  // return S.Const("i32", Number(flt.text));
}
