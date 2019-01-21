import { PostfixUnaryExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseExpression } from "./expression";

export function parsePostfixUnaryExpression(ctx: Context, pue: PostfixUnaryExpression): Sexpr {
  // TODO: Check types! (mostly vs f32 etc)
  // TODO: Return previous value.
  // TODO: consider ++ vs --

  return S.SetLocal(pue.operand.getText(), S(
      "i32",
      "i32.add",
      parseExpression(ctx, pue.operand),
      S.Const("i32", 1),
    )
  );
}
