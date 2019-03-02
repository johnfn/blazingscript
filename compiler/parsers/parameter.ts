import { ParameterDeclaration, TypeFlags } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Scope } from "../scope/scope";
import { buildNode } from "./nodeutil";
import { isArrayType, isFunctionType } from "./arrayliteral";
import { flattenArray } from "../util";
import { BSBindingName } from "./expression";

/**
 * e.g. function foo(x: number) { return x; }
 *                   ^^^^^^^^^
 */
export class BSParameter extends BSNode {
  children   : BSNode[];
  initializer: BSNode | null;
  bindingName: BSBindingName;

  constructor(scope: Scope, node: ParameterDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.initializer = buildNode(scope, node.initializer);
    this.bindingName = buildNode(scope, node.name);
    this.children = flattenArray(
      this.initializer,
      this.bindingName,
    );

    if (
      this.tsType.flags & TypeFlags.NumberLike    ||
      this.tsType.flags & TypeFlags.StringLike    ||
      this.tsType.flags & TypeFlags.TypeParameter || 
      isFunctionType(scope, this.tsType)          ||
      isArrayType(this.tsType)
    ) {
      scope.variables.add({ name: this.bindingName.text, wasmType: "i32", isParameter: true });
    } else {
      throw new Error(`Do not know how to handle that type: ${ TypeFlags[this.tsType.flags] } for ${ this.fullText }`);
    }
  }

  compile(scope: Scope): CompileResultExpr {
    throw new Error("Trying to compile a parameter but dunno how");
  }
}
