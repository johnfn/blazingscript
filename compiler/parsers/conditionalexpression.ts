import { ConditionalExpression } from "typescript";
import { Context } from "../context";
import { Sexpr, S } from "../sexpr";
import { BSNode } from "./bsnode";
import { BSExpression } from "./expression";
import { flatArray } from "../util";
import { buildNode } from "./nodeutil";

/**
 * e.g. const x = foo ? 1 : 2;
 *                ^^^^^^^^^^^
 */
export class BSConditionalExpression extends BSNode {
  children : BSNode[];

  condition: BSExpression;
  whenFalse: BSExpression;
  whenTrue : BSExpression;

  constructor(ctx: Context, node: ConditionalExpression) {
    super(ctx, node);

    this.children = flatArray(
      this.condition = buildNode(ctx, node.condition),
      this.whenFalse = buildNode(ctx, node.whenFalse),
      this.whenTrue  = buildNode(ctx, node.whenTrue),
    );
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
