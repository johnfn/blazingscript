import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { NamedImports } from "typescript";
import { buildNodeArray } from "./nodeutil";

export class BSNamedImports extends BSNode {
  children: BSNode[];

  constructor(ctx: Scope, node: NamedImports, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = buildNodeArray(ctx, node.elements);
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }
}
