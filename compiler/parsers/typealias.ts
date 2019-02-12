import { TypeAliasDeclaration } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Scope } from "../scope/scope";

export class BSTypeAliasDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(scope: Scope, node: TypeAliasDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);
  }

  compile(scope: Scope): null {
    return null;
  }
}
