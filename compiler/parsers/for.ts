import { Context } from "../program";
import { ForStatement, SyntaxKind, VariableDeclarationList } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseExpression } from "./expression";
import { parseStatement } from "./statement";

export function parseForStatement(ctx: Context, fs: ForStatement): Sexpr {
  const initializerSexprs: Sexpr[] = [];

  if (fs.initializer) {
    if (fs.initializer.kind === SyntaxKind.VariableDeclarationList) {
      const vdl = fs.initializer as VariableDeclarationList;

      for (const v of vdl.declarations) {
        if (v.initializer) {
          initializerSexprs.push(
            S.SetLocal(
              v.name.getText(),
              parseExpression(ctx, v.initializer)
            )
          );
        }
      }
    } else {
      throw new Error("got non vdl for for loop")
    }
  }

  // "statement" is the entire for statement body

  const body = parseStatement(ctx, fs.statement);
  const cond = fs.condition ? parseExpression(ctx, fs.condition) : null;
  const inc = fs.incrementor ? parseExpression(ctx, fs.incrementor) : null;
  const wasmBody = [
    ...(body ? [body] : []),
    ...(inc ? [inc] : []),
    ...(cond ? [S("[]", "br_if", "$block", cond)] : []),
    S("[]", "br", "$loop"),
  ];

  return S(
    "i32",
    "block", "$block",
    ...initializerSexprs,
    S("[]", "loop", "$loop",
      ...wasmBody,
    )
  );
}
