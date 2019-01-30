import { Context } from "../context";
import { Sexpr } from "../sexpr";
import { BSNode } from "./bsnode";

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
