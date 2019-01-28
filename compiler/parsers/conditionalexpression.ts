import { ConditionalExpression } from "typescript";
import { Context } from "../context";
import { Sexpr, S } from "../sexpr";
import { BSNode } from "./bsnode";
import { getExpressionNode } from "./expression";

export class BSConditionalExpression extends BSNode {
  children: BSNode[];

  condition: BSNode;
  whenFalse: BSNode;
  whenTrue: BSNode;

  constructor(ctx: Context, node: ConditionalExpression) {
    super(ctx, node);

    this.condition = getExpressionNode(ctx, node.condition);
    this.whenFalse = getExpressionNode(ctx, node.whenFalse);
    this.whenTrue = getExpressionNode(ctx, node.whenTrue);

    this.children = [this.condition, this.whenFalse, this.whenTrue];
  }

  compile(ctx: Context): Sexpr {
    // TODO this is wrong because it always evaluates both sides

    const whenTrueExpr = this.whenTrue.compile(ctx);
    const whenFalseExpr = this.whenFalse.compile(ctx);
    const condExpr = this.condition.compile(ctx);

    if (!whenTrueExpr)
      throw new Error("no true expr in conditional expression.");
    if (!whenFalseExpr)
      throw new Error("no false expr in conditional expression.");
    if (!condExpr) throw new Error("no cond expr in conditional expression.");

    return S("i32", "select", whenTrueExpr, whenFalseExpr, condExpr);
  }
}
