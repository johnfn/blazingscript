import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { NamedImports, ImportSpecifier } from "typescript";
import { buildNodeArray } from "./nodeutil";

export class BSImportSpecifier extends BSNode {
  children: BSNode[];

  constructor(ctx: Scope, node: ImportSpecifier, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = [];

    const type = ctx.typeChecker.getTypeAtLocation(node);

    /*
    ctx.variables.add({
      name       : node.name.text,
      tsType     : ctx.typeChecker.getTypeAtLocation(node),
      wasmType   : "i32",
      isParameter: false,
    })
    */
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }
}
