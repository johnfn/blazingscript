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

  constructor(scope: Scope, node: AsExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flatArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): Sexpr {
    return this.expression.compile(scope);
  }
}
