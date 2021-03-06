import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Scope } from "../scope/scope";
import { Sexpr, S } from "../sexpr";
import { Node } from "typescript";

/**
 * e.g. const x = false
 *                ^^^^^
 */
export class BSFalseKeyword extends BSNode {
  children: BSNode[];

  constructor(scope: Scope, node: Node, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = [];
  }

  compile(scope: Scope): CompileResultExpr {
    return {
      expr: S.Const(0),
      functions: [],
    };
  }
}
