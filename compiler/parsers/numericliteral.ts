import { NumericLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";

export class BSNumericLiteral extends BSNode {
  children: BSNode[] = [];
  value   : number;

  constructor(ctx: Context, node: NumericLiteral) {
    super(ctx, node);

    // TODO: Won't handle weird literals?

    this.value = Number(node.text);
  }

  compile(ctx: Context): Sexpr {
    return S.Const("i32", this.value);
  }
}
