import { ParenthesizedExpression } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Scope } from "../scope/scope";
import { Sexpr } from "../sexpr";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";

/**
 * e.g. const x = (1 + 2) * 3;
 *                ^^^^^^^
 */
export class BSParenthesizedExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(scope: Scope, node: ParenthesizedExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    return this.expression.compile(scope);
  }
}
