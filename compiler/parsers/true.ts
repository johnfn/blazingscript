import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { Node } from "typescript";

export class BSTrueKeyword extends BSNode {
  children: BSNode[];

  constructor(scope: Scope, node: Node, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = [];
  }

  compile(scope: Scope): CompileResultExpr {
    return {
      expr: S.Const(1),
      functions: [],
    };
  }
}
