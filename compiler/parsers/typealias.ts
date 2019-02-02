import { TypeAliasDeclaration } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Scope } from "../scope/scope";

export class BSTypeAliasDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Scope, node: TypeAliasDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);
  }

  compile(ctx: Scope): null {
    return null;
  }
}
