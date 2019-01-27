import { BSNode } from "../rewriter";
import { BSExpression } from "./expression";
import { ParameterDeclaration } from "typescript";

export class BSParameter extends BSNode {
  children: BSNode[];
  initializer: BSExpression | null;

  constructor(node: ParameterDeclaration) {
    super();

    this.initializer = node.initializer ? new BSExpression(node.initializer) : null;

    this.children = [
      ...(this.initializer ? [this.initializer] : []),
    ]
  }
}
