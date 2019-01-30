import { ParenthesizedExpression } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr } from "../sexpr";
import { getExpressionNode, BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. const x = (1 + 2) * 3;
 *                ^^^^^^^
 */
export class BSParenthesizedExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(ctx: Context, node: ParenthesizedExpression) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Context): Sexpr {
    return this.expression.compile(ctx);
  }
}
