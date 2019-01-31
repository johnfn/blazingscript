import { ParameterDeclaration, TypeFlags } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { buildNode } from "./nodeutil";
import { isArrayType } from "./arrayliteral";
import { flatArray } from "../util";
import { BSBindingName } from "./expression";

/**
 * e.g. function foo(x: number) { return x; }
 *                   ^^^^^^^^^
 */
export class BSParameter extends BSNode {
  children   : BSNode[];
  initializer: BSNode | null;
  bindingName: BSBindingName;

  constructor(ctx: Context, node: ParameterDeclaration) {
    super(ctx, node);

    if (this.tsType === undefined) {
      throw new Error("asdf");
    }

    this.initializer = buildNode(ctx, node.initializer);
    this.bindingName = buildNode(ctx, node.name);
    this.children = flatArray(
      this.initializer,
      this.bindingName,
    );

    if (
      this.tsType.flags & TypeFlags.NumberLike ||
      this.tsType.flags & TypeFlags.StringLike ||
      isArrayType(ctx, this.tsType)
    ) {
      ctx.addVariableToScope({ name: this.bindingName.text, tsType: this.tsType, wasmType: "i32", isParameter: true });
    } else {
      throw new Error(`Do not know how to handle that type: ${ TypeFlags[this.tsType.flags] } for ${ this.fullText }`);
    }
  }

  compile(ctx: Context): null {
    throw new Error("Trying to compile a parameter but dunno how");
  }
}
