import { BSExpression } from "./expression";
import { AsExpression } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { Sexpr } from "../sexpr";
import { flatArray } from "../util";
import { buildNodeArray, buildNode } from "./nodeutil";

/**
 * e.g. const x = "hi" as Foo
 *                ^^^^^^^^^^^
 */
export class BSAsExpression extends BSNode {
  children: BSNode[];
  expression: BSExpression;

  constructor(ctx: Context, node: AsExpression) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Context): Sexpr {
    return this.expression.compile(ctx);
  }
}
