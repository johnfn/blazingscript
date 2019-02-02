import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Scope } from "../scope/scope";
import { Sexpr, S } from "../sexpr";
import { Node } from "typescript";

/**
 * e.g. const x = false
 *                ^^^^^
 */
export class BSFalseKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Scope, node: Node, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }
}
