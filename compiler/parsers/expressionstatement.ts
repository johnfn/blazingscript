import { Context } from "../context";
import { ExpressionStatement, isExpressionStatement } from "typescript";
import { Sexpr } from "../sexpr";
import { BSNode } from "./bsnode";
import { getExpressionNode } from "./expression";

/**
 * e.g. for (let x = 1; x < 5; x += 1) { }
 *                             ^^^^^^
 */
export class BSExpressionStatement extends BSNode {
  children: BSNode[];
  expression: BSNode;
  nodeREMOVE: ExpressionStatement;

  constructor(ctx: Context, node: ExpressionStatement) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
    this.nodeREMOVE = node;
  }

  compile(ctx: Context): Sexpr | null {
    return this.expression.compile(ctx);
  }
}
