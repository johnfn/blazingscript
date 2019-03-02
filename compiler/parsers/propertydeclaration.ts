import { PropertyDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSDecorator } from "./decorator";
import { buildNodeArray, buildNode } from "./nodeutil";
import { flattenArray, assertNever } from "../util";
import { BSPropertyName } from "./expression";
import { InternalPropertyType } from "../scope/properties";

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

    this.children = flattenArray(
      this.decorators = buildNodeArray(scope, node.decorators),
      this.name       = buildNode(scope, node.name),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    return { expr: S.Const(0), functions: [] };
  }

}
