import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { ImportClause } from "typescript";
import { buildNode } from "./nodeutil";
import { BSNamedImports } from "./namedimports";
import { BSNamespaceImport } from "./namespaceimport";

export class BSImportClause extends BSNode {
  children: BSNode[];
  namedBindings: BSNamedImports | BSNamespaceImport | null;

  constructor(ctx: Scope, node: ImportClause, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.namedBindings = buildNode(ctx, node.namedBindings);

    this.children = this.namedBindings ? [
      this.namedBindings,
    ] : [];
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }
}
