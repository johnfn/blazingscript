import { VariableStatement, SyntaxKind, Modifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSVariableDeclarationList } from "./variabledeclarationlist";
import { BSNode } from "./bsnode";

export class BSVariableStatement extends BSNode {
  children       : BSNode[];
  declarationList: BSVariableDeclarationList;

  constructor(ctx: Context, node: VariableStatement) {
    super(ctx, node);

    this.declarationList = new BSVariableDeclarationList(ctx, node.declarationList);
    this.children        = [this.declarationList];
  }

  compile(ctx: Context): Sexpr | null {
    // TODO this code is EXTRA dumb. it needs to compile the inner vdl.

    for (const mod of this.modifiers || []) {
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

    return this.declarationList.compile(ctx);
  }
}