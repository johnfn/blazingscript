import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseStatement } from "./statement";
import { parseExpression } from "./expression";

export function parseIfStatement(ctx: Context, node: IfStatement): Sexpr {
  let thn = parseStatement(ctx, node.thenStatement) || S.Const("i32", 0);
  let els = node.elseStatement ? parseStatement(ctx, node.elseStatement) : undefined;

  if (thn.type !== "[]") {
    thn = S.Drop(thn);
  }

  if (els && els.type !== "[]") {
    els = S.Drop(els);
  }

  const result = S(
    "[]",
    "if",
    parseExpression(ctx, node.expression),
    S("[]", "then", thn),
    S("[]", "else", els ? els : S("[]", "nop"))
  );

  return result;
}
