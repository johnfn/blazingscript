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

  constructor(scope: Scope, node: ImportSpecifier, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    if (!info.moduleName) {
      throw new Error("BSImportSpecifier without module name.");
    }

    this.moduleName = info.moduleName;

    this.children = [
      this.name  = buildNode(scope, node.name),
    ];

    const type = scope.typeChecker.getTypeAtLocation(node);

    if (isFunctionType(scope, type)) {
      scope.functions.addFunction(this);
    } else {
      scope.addScopeFor({ type: ScopeName.Class, symbol: this.tsType.symbol });
      const classScope = scope.getChildScope({ type: ScopeName.Class, symbol: this.tsType.symbol });

      BSClassDeclaration.AddClassToScope({ scope: classScope, symbol: this.tsType.symbol });
      // throw new Error("nope not yet!");
    }


    // scope.functions.addFunction(this);

    /*
    scope.variables.add({
      name       : node.name.text,
      tsType     : scope.typeChecker.getTypeAtLocation(node),
      wasmType   : "i32",
      isParameter: false,
    })
    */
  }

  compile(scope: Scope): Sexpr {
    return S.Const(0);
  }
}
