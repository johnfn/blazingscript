import { ClassDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";

// TODO: Handle label.

export function parseClass(ctx: Context, statement: ClassDeclaration): Sexpr {
  return S("[]", "nop");
}
