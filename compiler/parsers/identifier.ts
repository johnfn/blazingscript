import { Identifier, SignatureKind } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

/**
 * e.g. const foo = 5
 *            ^^^
 */
export class BSIdentifier extends BSNode {
  children: BSNode[] = [];
  text    : string;
  isLhs   : boolean;

  constructor(scope: Scope, node: Identifier, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.text  = node.text;
    this.isLhs = info.isLhs || false;
  }

  compile(scope: Scope): Sexpr {
    const asVariable = scope.variables.getOrNull(this.text);

    if (asVariable) {
      return asVariable;
    }

    const fn = scope.functions.getFunctionByName(this.text);
    const signatures = scope.typeChecker.getSignaturesOfType(this.tsType, SignatureKind.Call);
    if (signatures.length > 1) { throw new Error("Dont support functions with > 1 signature yet."); }
    if (signatures.length === 0) { 
      console.log(scope.localToString());
      throw new Error(`Cant find a function named ${ this.text }`); 
    }
    const signature = signatures[0];
    const isGeneric = signature.typeParameters ? signature.typeParameters.length > 0 : false;

    if (fn) {
      if (isGeneric) {
        const typeParamName = signature.typeParameters![0].symbol.name;
        const typeParamType = scope.typeParams.get(typeParamName);

        return S.Const(fn.getTableIndex(typeParamType.substitutedType));
      } else {
        return S.Const(fn.getTableIndex());
      }
    }

    console.log(this.text);
    // console.log(scope.topmostScope().toString());

    throw new Error("Unhandled node type");
  }
}
