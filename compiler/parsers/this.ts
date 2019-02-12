import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

export class BSThisKeyword extends BSNode {
  children: BSNode[];

  constructor(scope: Scope, node: ThisExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = [];
  }

  compile(scope: Scope): Sexpr {
    return S.GetLocal("i32", "__this");
  }
}
