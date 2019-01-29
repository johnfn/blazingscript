import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { getExpressionNode, BSExpression } from "./expression";
import { BSIdentifier } from "./identifier";
import { isArrayType } from "./arrayliteral";

/**
 * e.g. const x = foo.bar
 *                ^^^^^^^
 */
export class BSPropertyAccessExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;
  name      : BSIdentifier;

  constructor(ctx: Context, node: PropertyAccessExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.name       = new BSIdentifier(ctx, node.name);
    this.children   = [
      this.expression, 
      this.name,
    ];
  }

  compile(ctx: Context): Sexpr {
    const property = this.name.text;

    if (
      this.expression.tsType.flags & TypeFlags.StringLike ||
      this.expression.tsType.symbol.name === ctx.getNativeTypeName("String") // for this types
    ) {
      if (property === "length") {
        return ctx.callMethod({
          className : ctx.getNativeTypeName("String"),
          methodName: "strLen",
          thisExpr  : this.expression,
          argExprs  : []
        });
      }
    }

    if (isArrayType(ctx, this.expression.tsType)) {
      if (property === "length") {
        return ctx.callMethod({
          className : ctx.getNativeTypeName("Array"),
          methodName: "arrLen",
          thisExpr  : this.expression,
          argExprs  : []
        });
      }
    }

    throw new Error(`Todo ${this.fullText}`);
  }
}