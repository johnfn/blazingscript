import { Context } from "../context";
import { ExpressionStatement } from "typescript";
import { Sexpr } from "../sexpr";
import { parseExpression, BSExpression } from "./expression";
import { BSNode } from "../rewriter";

export class BSExpressionStatement extends BSNode {
  children: BSNode[];
  expression: BSExpression;

  constructor(node: ExpressionStatement) {
    super();

    this.expression = new BSExpression(node.expression);
    this.children = [this.expression];
  }
}

export function parseExpressionStatement(ctx: Context, es: ExpressionStatement): Sexpr {
  return parseExpression(ctx, es.expression);
}
