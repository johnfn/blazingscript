import { ReturnStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseExpression } from "./expression";
import { Context } from "../program";

export function parseReturnStatement(ctx: Context, rs: ReturnStatement): Sexpr {
  if (rs.expression) {
    return S("[]", "return",
      parseExpression(ctx, rs.expression),
    );
  } else {
    return S("[]", "return");
  }
}
