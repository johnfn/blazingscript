import { PropertyDeclaration } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSDecorator } from "./decorator";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSNumericLiteral } from "./numericliteral";
import { buildNodeArray, buildNode } from "./nodeutil";
import { flatArray } from "../util";
import { BSPropertyName } from "./expression";

/**
 * e.g. class Foo { x: number = 5 }
 *                  ^^^^^^^^^^^^^
 */
export class BSPropertyDeclaration extends BSNode {
  children  : BSNode[];
  decorators: BSDecorator[];
  name      : BSPropertyName;

  constructor(ctx: Context, node: PropertyDeclaration) {
    super(ctx, node);

    this.children = flatArray(
      this.decorators = buildNodeArray(ctx, node.decorators),
      this.name       = buildNode(ctx, node.name),
    );

    const offset = this.getOffset(this.decorators);

    if (offset !== null) {
      if (this.name instanceof BSIdentifier) {
        ctx.scope.properties.add({
          name    : this.name.text,
          offset  : offset,
          tsType  : this.tsType,
          wasmType: "i32",
        });
      } else {
        throw new Error("I currently dont handle property names that aren't identifiers.");
      }
    }
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Method not implemented.");
  }

  getOffset(decorators: BSDecorator[]): number | null {
    for (const deco of decorators) {
      if (!(deco.expression instanceof BSCallExpression)) {
        continue;
      }

      if (!(deco.expression.expression instanceof BSIdentifier)) {
        continue;
      }

      const calledFunction = deco.expression.expression.text;

      if (calledFunction === "offset") {
        const firstArgument = deco.expression.arguments[0];

        if (!(firstArgument instanceof BSNumericLiteral)) {
          continue;
        }

        return firstArgument.value;
      }
    }

    return null;
  }
}
