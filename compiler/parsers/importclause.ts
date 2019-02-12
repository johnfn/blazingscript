import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { ImportClause } from "typescript";
import { buildNode } from "./nodeutil";
import { BSNamedImports } from "./namedimports";
import { BSNamespaceImport } from "./namespaceimport";

/**
 * e.g.
 * 
 * import foo, { a, b, c } from "./foo"
 *        ^^^^^^^^^^^^^^^^
 */
export class BSImportClause extends BSNode {
  children: BSNode[];
  namedBindings: BSNamedImports | BSNamespaceImport | null;

  constructor(scope: Scope, node: ImportClause, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.namedBindings = buildNode(scope, node.namedBindings, info);

    this.children = this.namedBindings ? [
      this.namedBindings,
    ] : [];
  }

  compile(scope: Scope): Sexpr {
    return S.Const(0);
  }
}
