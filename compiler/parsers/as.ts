import { BSNode } from "../rewriter";
import { BSExpression } from "./expression";
import { AsExpression } from "typescript";

export class BSAsExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(node: AsExpression) {
    super();

    this.expression = new BSExpression(node.expression);
    this.children = [this.expression];
  }
}
