import { ContinueStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";

// TODO: Handle label.

/**
 * e.g. while (true) { continue; }
 *                     ^^^^^^^^^
 */
export class BSContinueStatement extends BSNode {
  children: BSNode[] = [];

  constructor(scope: Scope, node: ContinueStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);
  }

  compile(scope: Scope): CompileResultExpr {
    return {
      expr: scope.loops.getContinue(),
      functions: [],
    }
  }
}
