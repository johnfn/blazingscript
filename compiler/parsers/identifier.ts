import { Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";

export function parseIdentifier(ctx: Context, id: Identifier): Sexpr {
  return ctx.getVariable(id.text);
}
