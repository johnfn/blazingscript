import { BSNode } from "../rewriter";

import { BSExpression } from "./expression";

import { ParenthesizedExpression } from "typescript";

export class BSParenthesizedExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(node: ParenthesizedExpression) {
    super();

    this.expression = new BSExpression(node.expression);
    this.children = [this.expression];
  }
}
