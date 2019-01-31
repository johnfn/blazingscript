import { BSNode } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Context } from "../scope/context";
import { Decorator } from "typescript";
import { BSExpression } from "./expression";
import { flatArray } from "../util";
import { buildNode } from "./nodeutil";

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

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Cant compile decorators! They are only currently for metadata.");
  }
}
