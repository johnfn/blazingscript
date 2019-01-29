import { BSNode } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { Decorator } from "typescript";
import { BSExpressionNode, getExpressionNode } from "./expression";

export class BSDecorator extends BSNode {
  children  : BSNode[];
  expression: BSExpressionNode;

  constructor(ctx: Context, node: Decorator) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Cant compile decorators! They are only currently for metadata.");
  }
}
