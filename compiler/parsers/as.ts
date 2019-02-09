import { BSExpression } from "./expression";
import { AsExpression, Expression } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Scope } from "../scope/scope";
import { Sexpr } from "../sexpr";
import { flatArray } from "../util";
import { buildNodeArray, buildNode } from "./nodeutil";

/**
 * e.g. const x = "hi" as Foo
 *                ^^^^^^^^^^^
 */
export class BSAsExpression extends BSNode {
  children: BSNode[];
  expression: BSExpression;

  constructor(ctx: Scope, node: AsExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Scope): Sexpr {
    return this.expression.compile(ctx);
  }
}
