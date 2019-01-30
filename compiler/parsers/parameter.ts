import { ParameterDeclaration } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { parseBindingNameNode, BSBindingName } from "./bindingname";
import { buildNode } from "./nodeutil";

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
    this.bindingName = parseBindingNameNode(ctx, node.name);
    this.children = [
      ...(this.initializer ? [this.initializer] : []),
      this.bindingName,
    ];
  }

  compile(ctx: Context): null {
    throw new Error("Trying to compile a parameter but dunno how");
  }
}
