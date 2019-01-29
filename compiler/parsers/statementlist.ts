import { Context } from "../context";
import { NodeArray, Statement } from "typescript";
import { Sexpr } from "../sexpr";
import { parseStatement } from "./statement";
import { BSNode } from "./bsnode";

// TODO: Remove
export function parseStatementList(
  ctx: Context,
  list: NodeArray<Statement>
): Sexpr[] {
  let results: Sexpr[] = [];

  for (const statement of list) {
    const parsed = parseStatement(ctx, statement);

    if (parsed) {
      results = results.concat(parsed);
    }
  }

  return results;
}

export function parseStatementListBS(ctx: Context, nodes: BSNode[]): Sexpr[] {
  let results: Sexpr[] = [];

  for (const statement of nodes) {
    const compiled = statement.compile(ctx);

    if (compiled) {
      results = results.concat(compiled);
    }
  }

  return results;
}
