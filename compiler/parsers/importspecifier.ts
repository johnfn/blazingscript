import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { ImportSpecifier, TypeFlags, SignatureKind, SyntaxKind, SymbolFlags } from "typescript";
import { isFunctionType } from "./arrayliteral";
import { BSIdentifier } from "./identifier";
import { buildNode } from "./nodeutil";

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
      /*
      if (type.flags & TypeFlags.Object) {
        const sigs = ctx.typeChecker.getSignaturesOfType(type, SignatureKind.Construct);

        if (sigs.length > 1) {
          throw new Error("Cant handle multiple class signatures (idk how this could even happen!)")
        }

        if (sigs.length === 0) {
          console.log(ctx.typeChecker.typeToString(type));
          throw new Error("Exported an object with no call signatures?")
        }

        const instanceType = sigs[0].getReturnType();
        const props = ctx.typeChecker.getPropertiesOfType(instanceType);

        for (const prop of props) {
          const ty = ctx.typeChecker.getTypeOfSymbolAtLocation(prop, ctx.sourceFile!.node);

          console.log("sig len", ctx.typeChecker.getSignaturesOfType(ty, SignatureKind.Call).length);

          console.log(ty.flags);
          console.log(prop.name, ctx.typeChecker.typeToString(ty));
        }
      }
      */

      throw new Error("Unhandled import type.")
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
