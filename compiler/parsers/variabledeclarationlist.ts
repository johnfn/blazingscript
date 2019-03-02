import { VariableDeclarationList, SyntaxKind } from "typescript";
import { BSVariableDeclaration } from "./variabledeclaration";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Scope } from "../scope/scope";
import { S, Sexpr } from "../sexpr";
import { buildNodeArray } from "./nodeutil";
import { compileStatementList } from "./statementlist";

export class BSVariableDeclarationList extends BSNode {
  children    : BSNode[];
  declarations: BSVariableDeclaration[];
  isDeclare   = false;

  constructor(scope: Scope, node: VariableDeclarationList, info: NodeInfo = defaultNodeInfo) {
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

    this.declarations = buildNodeArray(scope, node.declarations);

    this.children = this.declarations;
  }

  compile(scope: Scope): CompileResultExpr {
    if (this.isDeclare) {
      return { expr: S.Const(0), functions: [] };
    } else {
      const compiledStatements = compileStatementList(scope, this.declarations);

      return {
        expr     : S.Block(compiledStatements.statements),
        functions: compiledStatements.functions,
      };
    }
  }
}
