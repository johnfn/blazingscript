import { Scope } from "../scope/scope";
import { ExpressionStatement, isExpressionStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";
import { BSExpression } from "./expression";

/**
 * e.g. result.length = size;
 *      ^^^^^^^^^^^^^^^^^^^^^
 */
export class BSExpressionStatement extends BSNode {
  children: BSNode[];
  expression: BSExpression;

  constructor(scope: Scope, node: ExpressionStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): Sexpr | null {
    const result = this.expression.compile(scope);

    if (result === null) {
      return null
    } else {
      if (result.type !== "[]") {
        return S.Drop(result);
      } else {
        return result;
      }
    }
  }
}
