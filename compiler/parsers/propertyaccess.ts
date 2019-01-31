import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSExpression } from "./expression";
import { BSIdentifier } from "./identifier";
import { isArrayType } from "./arrayliteral";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. const x = foo.bar
 *                ^^^^^^^
 */
export class BSPropertyAccessExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;
  name      : BSIdentifier;

  constructor(ctx: Context, node: PropertyAccessExpression) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
      this.name       = buildNode(ctx, node.name),
    );
  }

  compile(ctx: Context): Sexpr {
    return ctx.scope.properties.get(this.expression, this.name.text);
  }
}