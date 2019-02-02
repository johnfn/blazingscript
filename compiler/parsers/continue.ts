import { ContinueStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

// TODO: Handle label.

/**
 * e.g. while (true) { continue; }
 *                     ^^^^^^^^^
 */
export class BSContinueStatement extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Scope, node: ContinueStatement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);
  }

  compile(ctx: Scope): Sexpr {
    return ctx.loops.getContinue();
  }
}
