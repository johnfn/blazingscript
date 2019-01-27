import { ConditionalExpression } from "typescript";
import { Context } from "../context";
import { Sexpr, S } from "../sexpr";
import { parseExpression, BSExpression } from "./expression";
import { BSNode } from "../rewriter";

export class BSConditionalExpression extends BSNode {
  children: BSNode[];

  condition: BSExpression;
  whenFalse: BSExpression;
  whenTrue : BSExpression;

  constructor(node: ConditionalExpression) {
    super();

    this.condition = new BSExpression(node.condition);
    this.whenFalse = new BSExpression(node.whenFalse);
    this.whenTrue  = new BSExpression(node.whenTrue);

    this.children = [
      this.condition,
      this.whenFalse,
      this.whenTrue,
    ];
  }
}

export function parseConditionalExpression(ctx: Context, t: ConditionalExpression): Sexpr {
  // TODO this is wrong because it always evaluates both sides

  return S("i32", "select",
    parseExpression(ctx, t.whenTrue),
    parseExpression(ctx, t.whenFalse),
    parseExpression(ctx, t.condition),
  );
}
