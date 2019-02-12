import { Scope, ScopeName } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { ImportSpecifier, TypeFlags, SignatureKind, SyntaxKind, SymbolFlags } from "typescript";
import { isFunctionType } from "./arrayliteral";
import { BSIdentifier } from "./identifier";
import { buildNode } from "./nodeutil";
import { BSClassDeclaration } from "./class";

/**
 * e.g.
 * 
 * import { foo } from "./bar"
 *          ^^^
 */

export class BSImportSpecifier extends BSNode {
  children  : BSNode[];
  name      : BSIdentifier;
  moduleName: string;

  constructor(ctx: Scope, node: ImportSpecifier, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    if (!info.moduleName) {
      throw new Error("BSImportSpecifier without module name.");
    }

    this.moduleName = info.moduleName;

    this.children = [
      this.name  = buildNode(ctx, node.name),
    ];

    const type = ctx.typeChecker.getTypeAtLocation(node);

    if (isFunctionType(ctx, type)) {
      ctx.functions.addFunction(this);
    } else {
      ctx.addScopeFor({ type: ScopeName.Class, symbol: this.tsType.symbol });
      const classScope = ctx.getChildScope({ type: ScopeName.Class, symbol: this.tsType.symbol });

      BSClassDeclaration.AddClassToScope({ scope: classScope, symbol: this.tsType.symbol });
      // throw new Error("nope not yet!");
    }


    // ctx.functions.addFunction(this);

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
