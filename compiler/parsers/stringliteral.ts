import { Context } from "../context";
import { StringLiteral } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode } from "./bsnode";

export class BSStringLiteral extends BSNode {
  children: BSNode[] = [];
  text: string;

  constructor(ctx: Context, node: StringLiteral) {
    super(ctx, node);

    this.text = node.text;
  }

  compile(ctx: Context): Sexpr {
    return S("i32", 
      "block",
      S("[]", "result", "i32"),
      S.SetLocal(
        "myslocal",
        S("i32", "call", "$malloc", S.Const("i32", this.text.length + 4))
      ),
      // store length first
      S.Store(ctx.getVariable("myslocal"), S.Const("i32", this.text.length)),
      // then contents
      ...Sx.SetStringLiteralAtSexpr(ctx.getVariable("myslocal"), this.text),
      ctx.getVariable("myslocal")
    );
  }
}
