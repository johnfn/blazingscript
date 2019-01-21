import { Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";

export function parseIdentifier(ctx: Context, id: Identifier): Sexpr {
  return S.GetLocal("i32", id.text);
}
