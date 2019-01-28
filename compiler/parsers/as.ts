import { parseExpression, getExpressionNode, BSExpressionNode } from "./expression";
import { Type, AsExpression } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr } from "../sexpr";

export class BSAsExpression extends BSNode {
  children: BSNode[];
  expression: BSExpressionNode;

  constructor(ctx: Context, node: AsExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
  }

  compile(ctx: Context): Sexpr {
    return this.expression.compile(ctx);
  }
}
