import { getExpressionNode, BSExpression } from "./expression";
import { AsExpression } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr } from "../sexpr";

/**
 * e.g. const x = "hi" as Foo
 *                ^^^^^^^^^^^
 */
export class BSAsExpression extends BSNode {
  children: BSNode[];
  expression: BSExpression;

  constructor(ctx: Context, node: AsExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
  }

  compile(ctx: Context): Sexpr {
    return this.expression.compile(ctx);
  }
}
