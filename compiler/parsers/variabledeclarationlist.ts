import { VariableDeclarationList, SyntaxKind } from "typescript";
import { BSVariableDeclaration } from "./variabledeclaration";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Scope } from "../scope/scope";
import { S, Sexpr } from "../sexpr";
import { buildNodeArray } from "./nodeutil";

export class BSVariableDeclarationList extends BSNode {
  children    : BSNode[];
  declarations: BSVariableDeclaration[];
  isDeclare   = false;

  constructor(ctx: Scope, node: VariableDeclarationList, info: NodeInfo = defaultNodeInfo) {
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

    this.declarations = buildNodeArray(ctx, node.declarations);

    this.children = this.declarations;
  }

  compile(ctx: Scope): Sexpr {
    if (this.isDeclare) {
      return S.Const(0);
    } else {
      return S.Block(this.declarations.map(decl => decl.compile(ctx)));
    }
  }
}
