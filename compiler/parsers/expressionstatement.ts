import { Context } from "../context";
import { ExpressionStatement, isExpressionStatement } from "typescript";
import { Sexpr } from "../sexpr";
import { BSNode } from "./bsnode";
import { getExpressionNode } from "./expression";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. for (let x = 1; x < 5; x += 1) { }
 *                             ^^^^^^
 */
export class BSExpressionStatement extends BSNode {
  children: BSNode[];
  expression: BSNode;

  constructor(ctx: Context, node: ExpressionStatement) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Context): Sexpr | null {
    return this.expression.compile(ctx);
  }
}
