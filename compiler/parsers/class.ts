import { ClassDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";

// TODO: Handle label.

export function parseClass(ctx: Context, statement: ClassDeclaration): Sexpr {
  return S("[]", "nop");
}
