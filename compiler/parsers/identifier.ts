import { Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";

export class BSIdentifier extends BSNode {
  children: BSNode[] = [];

  constructor(node: Identifier) {
    super();
  }
}

export function parseIdentifier(ctx: Context, id: Identifier): Sexpr {
  return ctx.getVariable(id.text);
}
