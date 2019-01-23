import { Block } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementList } from "./statementlist";
import { Context } from "../program";

export function parseBlock(ctx: Context, block: Block): Sexpr {
  return S.Block(parseStatementList(ctx, block.statements));
}
