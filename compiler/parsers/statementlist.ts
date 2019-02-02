import { Scope } from "../scope/scope";
import { Sexpr } from "../sexpr";
import { BSNode } from "./bsnode";

export function parseStatementListBS(ctx: Scope, nodes: BSNode[]): Sexpr[] {
  let results: Sexpr[] = [];

  for (const statement of nodes) {
    const compiled = statement.compile(ctx);

    if (compiled) {
      results = results.concat(compiled);
    }
  }

  return results;
}
