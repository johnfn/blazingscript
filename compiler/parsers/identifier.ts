import { Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

/**
 * e.g. const foo = 5
 *            ^^^
 */
export class BSIdentifier extends BSNode {
  children: BSNode[] = [];
  text: string;

  constructor(ctx: Scope, node: Identifier, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.text = node.text;
  }

  compile(ctx: Scope): Sexpr {
    return ctx.variables.get(this.text);
  }
}
