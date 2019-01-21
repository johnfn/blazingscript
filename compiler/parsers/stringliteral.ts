import { Context } from "../program";
import { StringLiteral } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";

export function parseStringLiteral(ctx: Context, sl: StringLiteral): Sexpr {
  return S.Wrap("i32", [
    S.SetLocal(
      "myslocal",
      S("i32", "call", "$malloc", S.Const("i32", sl.text.length + 4))
    ),
    // store length first
    S.Store(
      S.GetLocal("i32", "myslocal"),
      S.Const("i32", sl.text.length),
    ),
    // then contents 
    ...Sx.SetStringLiteralAtSexpr(
      S.GetLocal("i32", "myslocal"),
      sl.text
    ),
    S.GetLocal("i32", "myslocal"),
  ]);
}
