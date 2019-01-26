import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../program";

export function parsePropertyAccess(ctx: Context, pa: PropertyAccessExpression): Sexpr {
  const expType = ctx.typeChecker.getTypeAtLocation(pa.expression);
  const property = pa.name.text;

  if (
    (expType.flags & TypeFlags.StringLike) ||
    (expType.symbol.name === "__String") // for this types
  ) {
    if (property === "length") {
      return ctx.callMethod({
        className: "__String",
        methodName: "strLen",
        thisExpr: pa.expression,
        argExprs: [],
      })
    }
  }

  throw new Error(`Todo ${ pa.getText() } ${ expType.flags }`);

  // return S.Const("i32", Number(flt.text));
}
