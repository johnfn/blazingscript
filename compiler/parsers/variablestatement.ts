import { VariableStatement, SyntaxKind, Modifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSVariableDeclarationList } from "./variabledeclarationlist";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

export class BSVariableStatement extends BSNode {
  children       : BSNode[];
  declarationList: BSVariableDeclarationList | null;
  isDeclare      = false;

  constructor(ctx: Scope, node: VariableStatement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    for (const mod of this.modifiers || []) {
      switch (mod.kind) {
        case SyntaxKind.DeclareKeyword:
          this.isDeclare = true;
          break;
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

    if (!this.isDeclare) {
      this.declarationList = new BSVariableDeclarationList(ctx, node.declarationList);
      this.children        = [this.declarationList];
    } else {
      this.declarationList = null;
      this.children        = [];
    }
  }

  compile(ctx: Scope): Sexpr | null {
    if (this.isDeclare) {
      return null
    } else {
      return this.declarationList!.compile(ctx);
    }
  }
}