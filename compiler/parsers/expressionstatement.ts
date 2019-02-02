import { Scope } from "../scope/scope";
import { ExpressionStatement, isExpressionStatement } from "typescript";
import { Sexpr } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. for (let x = 1; x < 5; x += 1) { }
 *                             ^^^^^^
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
    return this.expression.compile(ctx);
  }
}
