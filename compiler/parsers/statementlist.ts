import { Context } from "../program";
import { NodeArray, Statement } from "typescript";
import { Sexpr } from "../sexpr";
import { parseStatement } from "./statement";

export function parseStatementList(ctx: Context, list: NodeArray<Statement>): Sexpr[] {
  let results: Sexpr[] = [];

  for (const statement of list) {
    const parsed = parseStatement(ctx, statement);

    if (parsed) {
      results = results.concat(parsed);
    }
  }

  return results;
}