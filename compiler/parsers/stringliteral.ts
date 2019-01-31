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
    ctx.addVariableToScopeOnce("string_temp", this.tsType, "i32");
  }

  compile(ctx: Context): Sexpr {
    return S("i32",
      "block",
      S("[]", "result", "i32"),
      S.SetLocal(
        "string_temp",
        S("i32", "call", "$malloc", S.Const(this.text.length + 4))
      ),
      // store length first
      S.Store(ctx.getVariable("string_temp"), this.text.length),
      // then contents
      ...Sx.SetStringLiteralAtSexpr(ctx.getVariable("string_temp"), this.text),
      ctx.getVariable("string_temp")
    );
  }
}
