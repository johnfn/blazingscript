import { ParenthesizedExpression } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr } from "../sexpr";
import { getExpressionNode, BSExpression } from "./expression";

/**
 * e.g. const x = (1 + 2) * 3;
 *                ^^^^^^^
 */
export class BSParenthesizedExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(ctx: Context, node: ParenthesizedExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
  }

  compile(ctx: Context): Sexpr {
    return this.expression.compile(ctx);
  }
}
