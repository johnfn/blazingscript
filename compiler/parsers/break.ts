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

  constructor(ctx: Scope, node: BreakStatement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);
  }

  compile(ctx: Scope): Sexpr {
    return S("[]", "br", ctx.loops.getBreakLabel());
  }
}
