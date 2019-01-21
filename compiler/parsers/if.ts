import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseStatement } from "./statement";
import { parseExpression } from "./expression";

export function parseIfStatement(ctx: Context, node: IfStatement): Sexpr {
  let thn = parseStatement(ctx, node.thenStatement) || S.Const("i32", 0);
  let els = node.elseStatement ? parseStatement(ctx, node.elseStatement) : undefined;

  if (thn.type !== "i32") {
    thn = S.WrapWithType("i32", [thn]);
  }

  if (els && els.type !== "i32") {
    els = S.WrapWithType("i32", [els]);
  }

  const result = S(
    "i32",
    "if",
    "(result i32)",
    parseExpression(ctx, node.expression),
    S("i32", "then", thn),
    S("i32", "else", els ? els : S.Const("i32", 0)),
  );

  return result;
}
