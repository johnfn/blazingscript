import { PropertyAccessExpression, TypeFlags, ElementAccessExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { parseExpression, BSExpression } from "./expression";
import { BSNode } from "../rewriter";

export class BSElementAccessExpression extends BSNode {
  children : BSNode[];
  element  : BSExpression;
  argument : BSExpression;

  constructor(node: ElementAccessExpression) {
    super();

    this.element = new BSExpression(node.expression);
    this.argument = new BSExpression(node.argumentExpression);

    this.children = [this.element, this.argument];
  }
}

export function parseElementAccess(ctx: Context, pa: ElementAccessExpression): Sexpr {
  const arg   = pa.argumentExpression;
  const array = pa.expression;
  const arrayType = ctx.typeChecker.getTypeAtLocation(array);

  if (arrayType.flags & TypeFlags.StringLike) {
    return ctx.callMethod({
      className: ctx.getNativeTypeName("String"),
      methodName: "charAt",
      thisExpr: array,
      argExprs: [arg],
    });
  }

  throw new Error(`Dont know how to index into anything other than strings. ${ pa.getText() }`);
}
