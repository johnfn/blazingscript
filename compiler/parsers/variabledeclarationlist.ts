import { BSNode } from "../rewriter";
import { VariableDeclarationList } from "typescript";
import { BSVariableDeclaration } from "./variabledeclaration";

export class BSVariableDeclarationList extends BSNode {
  children: BSNode[];

  constructor(node: VariableDeclarationList) {
    super();

    this.children = node.declarations.map(decl => new BSVariableDeclaration(decl));
  }
}
