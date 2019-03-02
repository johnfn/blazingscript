import { Scope } from "../scope/scope";
import { ExpressionStatement, isExpressionStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr, CompileResultStatements } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";
import { BSExpression } from "./expression";

/**
 * e.g. result.length = size;
 *      ^^^^^^^^^^^^^^^^^^^^^
 */
export class BSExpressionStatement extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(scope: Scope, node: ExpressionStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    const result = this.expression.compile(scope);

    if (result.expr.type !== "[]") {
      return {
        expr     : S.Drop(result.expr),
        functions: result.functions,
      };
    } else {
      return {
        expr     : result.expr,
        functions: result.functions,
      };
    }
  }
}
