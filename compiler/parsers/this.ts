import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

export class BSThisKeyword extends BSNode {
  children: BSNode[];

  constructor(ctx: Scope, node: ThisExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = [];
  }

  compile(ctx: Scope): Sexpr {
    return S.GetLocal("i32", "__this");
  }
}
