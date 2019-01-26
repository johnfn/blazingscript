import { Context } from "../program";
import { ForStatement, SyntaxKind, VariableDeclarationList, validateLocaleAndSetLanguage } from "typescript";
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
      initializerSexprs.push(parseExpression(ctx, fs.initializer));
    }
  }

  const inc = fs.incrementor ? parseExpression(ctx, fs.incrementor) : null;

  // TODO - we generate an increment with every continue statement. im sure
  // there's a better way!

  ctx.addToLoopStack(inc);

  const body = parseStatement(ctx, fs.statement);
  const cond = fs.condition ? parseExpression(ctx, fs.condition) : null;

  const result = S(
    "i32",
    "block", ctx.getLoopBreakLabel(),
    ...initializerSexprs,
    S("[]", "loop", ctx.getLoopContinueLabel(),
      ...(cond ? [
        S("[]", "br_if", ctx.getLoopBreakLabel(), S("i32", "i32.eqz", cond))
      ] : []),
      ...(body ? [body] : []),
      ...(inc  ? [inc] : []),
      S("[]", "br", ctx.getLoopContinueLabel()),
    )
  );

  ctx.popFromLoopStack();

  return result;
}
