import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { ImportClause, NamespaceImport } from "typescript";

export class BSNamespaceImport extends BSNode {
  children: BSNode[];

  constructor(ctx: Scope, node: NamespaceImport, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = [ ];
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }
}
