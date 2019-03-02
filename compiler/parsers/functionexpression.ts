import {
  FunctionDeclaration,
} from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";

/**
 * e.g. const x = function () { }
 *                ^^^^^^^^^^^^^^^
 */
export class BSFunctionExpression extends BSNode {
  children = [];

  constructor(scope: Scope, node: FunctionDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);
  }

  compile(scope: Scope): CompileResultExpr {
    throw new Error("unhandled node: function expression")
  }
}
