import { ConditionalExpression } from "typescript";
import { Scope } from "../scope/scope";
import { Sexpr, S } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { flattenArray } from "../util";
import { buildNode } from "./nodeutil";

/**
 * e.g. const x = foo ? 1 : 2;
 *                ^^^^^^^^^^^
 */
export class BSConditionalExpression extends BSNode {
  children : BSNode[];

  condition: BSExpression;
  whenFalse: BSExpression;
  whenTrue : BSExpression;

  constructor(scope: Scope, node: ConditionalExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.condition = buildNode(scope, node.condition),
      this.whenFalse = buildNode(scope, node.whenFalse),
      this.whenTrue  = buildNode(scope, node.whenTrue),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    // TODO this is wrong because it always evaluates both sides

    const whenTrueExpr  = this.whenTrue.compile(scope);
    const whenFalseExpr = this.whenFalse.compile(scope);
    const condExpr      = this.condition.compile(scope);

    if (!whenTrueExpr)  throw new Error("no true expr in conditional expression.");
    if (!whenFalseExpr) throw new Error("no false expr in conditional expression.");
    if (!condExpr)      throw new Error("no cond expr in conditional expression.");

    return {
      expr: S("i32", "select", whenTrueExpr.expr, whenFalseExpr.expr, condExpr.expr),
      functions: [
        ...whenTrueExpr.functions,
        ...whenFalseExpr.functions,
        ...condExpr.functions,
      ],
    }
  }
}
