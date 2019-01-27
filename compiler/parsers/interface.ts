import { BSNode } from "../rewriter";

import { InterfaceDeclaration } from "typescript";

export class BSInterfaceDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(node: InterfaceDeclaration) {
    super();
  }
}
