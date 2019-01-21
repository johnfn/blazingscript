import { VariableStatement, SyntaxKind } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseExpression } from "./expression";

export function parseVariableStatement(ctx: Context, vs: VariableStatement): Sexpr | null {
  for (const mod of vs.modifiers || []) {
    switch (mod.kind) {
      case SyntaxKind.DeclareKeyword:
        // completely skip declare statements as they have no impact on output
        return null;
      case SyntaxKind.AbstractKeyword:
      case SyntaxKind.AsyncKeyword:
      case SyntaxKind.ConstKeyword:
      case SyntaxKind.DefaultKeyword:
      case SyntaxKind.ExportKeyword:
      case SyntaxKind.PublicKeyword:
      case SyntaxKind.PrivateKeyword:
      case SyntaxKind.ProtectedKeyword:
      case SyntaxKind.ReadonlyKeyword:
      case SyntaxKind.StaticKeyword:
    }
  }

  if (vs.declarationList.declarations.length > 1) {
    throw new Error("Cant handle more than 1 declaration!!!");
  }

  const decl = vs.declarationList.declarations[0];

  if (decl.name.kind === SyntaxKind.Identifier) {
    const name = decl.name.getText();

    return S.SetLocal(name, decl.initializer ? parseExpression(ctx, decl.initializer) : S.Const("i32", 0));
  } else {
    throw new Error("I dont handle destructuring in variable names");
  }
}
