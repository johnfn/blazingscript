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
      scope.functions.addFunction(this.tsType);
    } else {
      const importedClassScope = scope.addScopeFor({ type: ScopeName.Class, symbol: this.tsType.symbol });

      BSClassDeclaration.AddClassToScope({ scope: importedClassScope, symbol: this.tsType.symbol });
    }
  }

  compile(scope: Scope): Sexpr {
    return S.Const(0);
  }
}
