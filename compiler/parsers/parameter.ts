import { ParameterDeclaration } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr } from "../sexpr";
import { getExpressionNode } from "./expression";

export class BSParameter extends BSNode {
  children: BSNode[];
  initializer: BSNode | null;

  constructor(ctx: Context, node: ParameterDeclaration) {
    super(ctx, node);

    this.initializer = node.initializer
      ? getExpressionNode(ctx, node.initializer)
      : null;

    this.children = [...(this.initializer ? [this.initializer] : [])];
  }

  compile(ctx: Context): null {
    throw new Error("Trying to compile a parameter but dunno how");
  }
}
