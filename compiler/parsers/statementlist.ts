import { Scope } from "../scope/scope";
import { Sexpr } from "../sexpr";
import { BSNode } from "./bsnode";

export function parseStatementListBS(scope: Scope, nodes: BSNode[]): Sexpr[] {
  let results: Sexpr[] = [];

  for (const statement of nodes) {
    const compiled = statement.compile(scope);

    if (compiled) {
      results = results.concat(compiled);
    }
  }

  return results;
}
