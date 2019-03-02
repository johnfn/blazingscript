import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { NamedImports } from "typescript";
import { buildNodeArray } from "./nodeutil";
import { BSImportSpecifier } from "./importspecifier";

/**
 * e.g.
 * 
 * import foo, { a, b, c } from "./foo"
 *             ^^^^^^^^^^^
 */
export class BSNamedImports extends BSNode {
  children: BSNode[];
  imports: BSImportSpecifier[];

  constructor(scope: Scope, node: NamedImports, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.imports = buildNodeArray(scope, node.elements, info);
    this.children = [
      ...this.imports,
    ];
  }

  compile(scope: Scope): CompileResultExpr {
    return {
      expr     : S.Const(0),
      functions: [],
    };
  }
}
