import { ParameterDeclaration } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { getExpressionNode } from "./expression";
import { parseBindingNameNode, BSBindingName } from "./bindingname";

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

    this.initializer = node.initializer
      ? getExpressionNode(ctx, node.initializer)
      : null;

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
