import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { ImportClause, NamespaceImport } from "typescript";

export class BSNamespaceImport extends BSNode {
  children: BSNode[];

  constructor(scope: Scope, node: NamespaceImport, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = [ ];
  }

  compile(scope: Scope): Sexpr {
    return S.Const(0);
  }
}
