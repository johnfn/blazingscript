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

export type PropertyType =
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

  constructor(scope: Scope, node: PropertyDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flatArray(
      this.decorators = buildNodeArray(scope, node.decorators),
      this.name       = buildNode(scope, node.name),
    );
  }

  compile(scope: Scope): Sexpr {
    return S.Const(0);
  }

}
