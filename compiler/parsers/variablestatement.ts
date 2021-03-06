import { VariableStatement, SyntaxKind, Modifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSVariableDeclarationList } from "./variabledeclarationlist";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";

export class BSVariableStatement extends BSNode {
  children       : BSNode[];
  declarationList: BSVariableDeclarationList | null;
  isDeclare      = false;

  constructor(scope: Scope, node: VariableStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

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
      this.declarationList = new BSVariableDeclarationList(scope, node.declarationList);
      this.children        = [this.declarationList];
    } else {
      this.declarationList = null;
      this.children        = [];
    }
  }

  compile(scope: Scope): CompileResultExpr {
    if (this.isDeclare) {
      return { expr: S.Const(0), functions: [] };
    } else {
      return this.declarationList!.compile(scope);
    }
  }
}