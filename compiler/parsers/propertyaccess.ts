import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSExpression } from "./expression";
import { BSIdentifier } from "./identifier";
import { isArrayType } from "./arrayliteral";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

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

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
      this.name       = buildNode(ctx, node.name),
    );
  }

  compile(ctx: Context): Sexpr {
    const property = this.name.text;

    return ctx.getProperty(this.expression, this.name.text);

    /*
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
    */
  }
}