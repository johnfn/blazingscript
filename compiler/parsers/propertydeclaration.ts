import { PropertyDeclaration } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSDecorator } from "./decorator";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSNumericLiteral } from "./numericliteral";
import { buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. class Foo { x: number = 5 }
 *                  ^^^^^^^^^^^^^
 */
export class BSPropertyDeclaration extends BSNode {
  children  : BSNode[];
  decorators: BSDecorator[];

  constructor(ctx: Context, node: PropertyDeclaration) {
    super(ctx, node);

    this.children = flatArray(
      this.decorators = buildNodeArray(ctx, node.decorators),
    );

    console.log(this.getOffset(this.decorators));
    // console.log(this.fullText);
    this.children = [];
  }

  compile(ctx: Context): Sexpr {
    throw new Error("Method not implemented.");
  }

  getOffset(decorators: BSDecorator[]): number | null {
    let offset: number | null = null;

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
