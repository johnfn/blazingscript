import { BSNode } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { Decorator } from "typescript";
import { BSExpression, getExpressionNode } from "./expression";

/**
 * e.g. class MyClass { @foo myFunction() { } }
 *                      ^^^^
 * 
 * (Note the JS limitation that decorators can not be added to top-level
 * functions.)
 */
export class BSDecorator extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(ctx: Context, node: Decorator) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Cant compile decorators! They are only currently for metadata.");
  }
}
