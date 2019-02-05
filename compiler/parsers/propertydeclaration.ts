import { PropertyDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, InternalPropertyType } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSDecorator } from "./decorator";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSNumericLiteral } from "./numericliteral";
import { buildNodeArray, buildNode } from "./nodeutil";
import { flatArray, assertNever } from "../util";
import { BSPropertyName } from "./expression";

type PropertyType =
  | { type: InternalPropertyType.Value, offset: number }
  | { type: InternalPropertyType.Array, offset: number }

/**
 * e.g. class Foo { x: number = 5 }
 *                  ^^^^^^^^^^^^^
 */
export class BSPropertyDeclaration extends BSNode {
  children  : BSNode[];
  decorators: BSDecorator[];
  name      : BSPropertyName;

  constructor(ctx: Scope, node: PropertyDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.decorators = buildNodeArray(ctx, node.decorators),
      this.name       = buildNode(ctx, node.name),
    );

    const propInfo = this.getPropertyType(this.decorators);

    if (propInfo !== null) {
      if (this.name instanceof BSIdentifier) {
        if (propInfo.type === InternalPropertyType.Value) {
          ctx.properties.add({
            name    : this.name.text,
            offset  : propInfo.offset,
            tsType  : this.tsType,
            type    : InternalPropertyType.Value,
            wasmType: "i32",
          });
        } else if (propInfo.type === InternalPropertyType.Array) {
          ctx.properties.add({
            name    : this.name.text,
            offset  : propInfo.offset,
            tsType  : this.tsType,
            type    : InternalPropertyType.Array,
            wasmType: "i32",
          });
        } else {
          assertNever(propInfo);
        }
      } else {
        throw new Error("I currently dont handle property names that aren't identifiers.");
      }
    }
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }

  getPropertyType(decorators: BSDecorator[]): PropertyType | null {
    for (const deco of decorators) {
      if (!(deco.expression instanceof BSCallExpression)) {
        continue;
      }

      if (!(deco.expression.expression instanceof BSIdentifier)) {
        continue;
      }

      const calledFunction = deco.expression.expression.text;

      if (calledFunction === "property") {
        const firstArgument = deco.expression.arguments[0];

        if (!(firstArgument instanceof BSNumericLiteral)) {
          throw new Error("Invalid arguments to @property")
        }

        return { type: InternalPropertyType.Value, offset: firstArgument.value };
      }

      if (calledFunction === "arrayProperty") {
        const firstArgument = deco.expression.arguments[0];

        if (!(firstArgument instanceof BSNumericLiteral)) {
          throw new Error("Invalid arguments to @arrayProperty")
        }

        return { type: InternalPropertyType.Array, offset: firstArgument.value };
      }
    }

    return null;
  }
}
