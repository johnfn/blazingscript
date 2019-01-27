import { BSNode } from "../rewriter";
import { BSExpression } from "./expression";
import { VariableDeclaration } from "typescript";

export class BSVariableDeclaration extends BSNode {
  children  : BSNode[];
  initializer: BSExpression | null;

  constructor(node: VariableDeclaration) {
    super();

    this.initializer = node.initializer ? new BSExpression(node.initializer) : null;
    this.children = this.initializer ? [this.initializer] : [];
  }
}
