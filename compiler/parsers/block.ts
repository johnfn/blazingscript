import { Context } from "../program";
import { Block } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementList } from "./statementlist";

export function parseBlock(ctx: Context, block: Block): Sexpr {
  return S.Wrap("i32", parseStatementList(ctx, block.statements));
}
