import { NumericLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";

/**
 * e.g. const x = 20;
 *                ^^
 */
export class BSNumericLiteral extends BSNode {
  children: BSNode[] = [];
  value   : number;

  constructor(ctx: Context, node: NumericLiteral) {
    super(ctx, node);

    // TODO: Won't handle weird literals?

    this.value = Number(node.text);
  }

  compile(ctx: Context): Sexpr {
    return S.Const(this.value);
  }
}
