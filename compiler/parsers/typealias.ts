import { TypeAliasDeclaration } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Scope } from "../scope/scope";
import { S } from "../sexpr";

export class BSTypeAliasDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(scope: Scope, node: TypeAliasDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);
  }

  compile(scope: Scope): CompileResultExpr {
    return { expr: S.Const(0), functions: [] };
  }
}
