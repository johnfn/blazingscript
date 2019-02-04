import { Scope } from "../scope/scope";
import { ExpressionStatement, isExpressionStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. result.length = size;
 *      ^^^^^^^^^^^^^^^^^^^^^
 */
export class BSExpressionStatement extends BSNode {
  children: BSNode[];
  expression: BSNode;

  constructor(ctx: Scope, node: ExpressionStatement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Scope): Sexpr | null {
    const result = this.expression.compile(ctx);

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
