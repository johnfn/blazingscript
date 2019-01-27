import { TypeAliasDeclaration } from "typescript";
import { BSNode } from "../rewriter";

export class BSTypeAliasDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(node: TypeAliasDeclaration) {
    super();
  }
}
