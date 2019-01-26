import { PropertyAccessExpression, TypeFlags, ElementAccessExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseExpression } from "./expression";

export function parseElementAccess(ctx: Context, pa: ElementAccessExpression): Sexpr {
  const arg   = pa.argumentExpression;
  const array = pa.expression;

  const arrayType = ctx.typeChecker.getTypeAtLocation(array);

  if (arrayType.flags & TypeFlags.StringLike) {
    return S(
      "i32", 
      "call", 
      "$__String__charAt", 
      parseExpression(ctx, array),
      parseExpression(ctx, arg)
    );
  }

  throw new Error(`Dont know how to index into anything other than strings. ${ pa.getText() }`);
}
