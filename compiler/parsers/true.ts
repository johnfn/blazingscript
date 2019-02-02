import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { Node } from "typescript";

export class BSTrueKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Scope, node: Node, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(1);
  }
}
