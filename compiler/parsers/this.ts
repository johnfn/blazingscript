import { ThisExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";

export class BSThisKeyword extends BSNode {
  children: BSNode[];

  constructor(scope: Scope, node: ThisExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = [];
  }

  compile(scope: Scope): CompileResultExpr {
    return { expr: S.GetLocal("i32", "__this"), functions: [] };
  }
}
