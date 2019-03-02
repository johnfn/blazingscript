import { Scope } from "../scope/scope";
import { BSNode, CompileResultExpr, CompileResultStatements, isCompileResultExpr, isCompileResultStatements } from "./bsnode";
import { assertNever } from "../util";

export function compileStatementList(scope: Scope, nodes: BSNode[]): CompileResultStatements {
  let result: CompileResultStatements = {
    statements: [],
    functions : [],
  }

  for (const statement of nodes) {
    const compiled = statement.compile(scope);

    if (compiled) {
      if (isCompileResultExpr(compiled)) {
        result.statements = [...result.statements, compiled.expr]
      } else if (isCompileResultStatements(compiled)) {
        result.statements = [...result.statements, ...compiled.statements];
      } else {
        return assertNever(compiled);
      }

      result.functions  = [...result.functions, ...compiled.functions];
    }
  }

  return result;
}
