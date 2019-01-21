import { Context } from "../program";
import { ExpressionStatement } from "typescript";
import { Sexpr } from "../sexpr";
import { parseExpression } from "./expression";

export function parseExpressionStatement(ctx: Context, es: ExpressionStatement): Sexpr {
  return parseExpression(ctx, es.expression);
}
