import { Block, BreakStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

// TODO: Handle label.

/**
 * e.g. while (true) { break; }
 *                     ^^^^^
 */
export class BSBreakStatement extends BSNode {
  children: BSNode[] = [];

  constructor(scope: Scope, node: BreakStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);
  }

  compile(scope: Scope): Sexpr {
    return S("[]", "br", scope.loops.getBreakLabel());
  }
}
