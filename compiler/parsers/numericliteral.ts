import { NumericLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";

export class BSNumericLiteral extends BSNode {
  children: BSNode[] = [];
  value   : number;

  constructor(node: NumericLiteral) {
    super();

    // TODO: Won't handle weird literals?

    this.value = Number(node.text);
  }
}

export function parseNumericLiteral(ctx: Context, flt: NumericLiteral): Sexpr {
  return S.Const("i32", Number(flt.text));
}
