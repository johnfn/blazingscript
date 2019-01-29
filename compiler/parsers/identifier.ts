import { Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";

/**
 * e.g. const foo = 5
 *            ^^^
 */
export class BSIdentifier extends BSNode {
  children: BSNode[] = [];
  text: string;

  constructor(ctx: Context, node: Identifier) {
    super(ctx, node);

    this.text = node.text;
  }

  compile(ctx: Context): Sexpr {
    return ctx.getVariable(this.text);
  }
}
