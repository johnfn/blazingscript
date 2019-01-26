import { PrefixUnaryExpression, SyntaxKind } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { parseExpression } from "./expression";

export function parsePrefixUnaryExpression(ctx: Context, pue: PrefixUnaryExpression): Sexpr {
  switch (pue.operator) {
    case SyntaxKind.ExclamationToken:
      return S("i32", "i32.eqz", parseExpression(ctx, pue.operand));
    case SyntaxKind.MinusToken:
      return S("i32", "i32.sub", S.Const("i32", 0), parseExpression(ctx, pue.operand));
    case SyntaxKind.PlusPlusToken:
    case SyntaxKind.MinusMinusToken:
    case SyntaxKind.PlusToken:
    case SyntaxKind.TildeToken:
      throw new Error(`unhandled unary prefix ${ pue.getText() }`);
  }
}
