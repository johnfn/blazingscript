import { ParenthesizedExpression } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Scope } from "../scope/scope";
import { Sexpr } from "../sexpr";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. const x = (1 + 2) * 3;
 *                ^^^^^^^
 */
export class BSParenthesizedExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(ctx: Scope, node: ParenthesizedExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Scope): Sexpr {
    return this.expression.compile(ctx);
  }
}
