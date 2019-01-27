import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";
import { BSExpression } from "./expression";

export class BSPropertyAccessExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(node: PropertyAccessExpression) {
    super();

    this.expression = new BSExpression(node.expression);
    this.children = [this.expression];
  }
}

export function parsePropertyAccess(ctx: Context, pa: PropertyAccessExpression): Sexpr {
  const expType = ctx.typeChecker.getTypeAtLocation(pa.expression);
  const property = pa.name.text;

  if (
    (expType.flags & TypeFlags.StringLike) ||
    (expType.symbol.name === ctx.getNativeTypeName("String")) // for this types
  ) {
    if (property === "length") {
      return ctx.callMethod({
        className: ctx.getNativeTypeName("String"), 
        methodName: "strLen",
        thisExpr: pa.expression,
        argExprs: [],
      })
    }
  }

  throw new Error(`Todo ${ pa.getText() } ${ expType.flags }`);

  // return S.Const("i32", Number(flt.text));
}
