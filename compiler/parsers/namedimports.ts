import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
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

  constructor(ctx: Scope, node: NamedImports, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.imports = buildNodeArray(ctx, node.elements, info);
    this.children = [
      ...this.imports,
    ];
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }
}
