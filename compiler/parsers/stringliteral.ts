import { Context } from "../context";
import { StringLiteral } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";

export function parseStringLiteral(ctx: Context, sl: StringLiteral): Sexpr {
  return S("i32", "block", S("[]", "result", "i32"), 
    S.SetLocal(
      "myslocal",
      S("i32", "call", "$malloc", S.Const("i32", sl.text.length + 4))
    ),
    // store length first
    S.Store(
      ctx.getVariable("myslocal"),
      S.Const("i32", sl.text.length),
    ),
    // then contents 
    ...Sx.SetStringLiteralAtSexpr(
      ctx.getVariable("myslocal"),
      sl.text
    ),
    ctx.getVariable("myslocal")
 );
}
