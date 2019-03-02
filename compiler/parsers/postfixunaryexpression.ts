import { PostfixUnaryExpression, PostfixUnaryOperator, SyntaxKind } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flattenArray, assertNever } from "../util";
import { BSExpression } from "./expression";

/**
 * e.g. myFunction(x++)
 *                 ^^^
 */
export class BSPostfixUnaryExpression extends BSNode {
  children   : BSNode[];
  expression : BSExpression;
  operandName: string;
  operator   : PostfixUnaryOperator;

  constructor(scope: Scope, node: PostfixUnaryExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.operator = node.operator;

    this.children = flattenArray(
      this.expression = buildNode(scope, node.operand),
    );

    this.operandName = node.operand.getText();
  }

  compile(scope: Scope): CompileResultExpr {
    // TODO: Check types! (mostly vs f32 etc)
    // TODO: Return previous value.
    // TODO: consider ++ vs --
    // TODO: Should use context to set local, it's safer

    const exprCompiled = this.expression.compile(scope);

    if (!exprCompiled) {
      throw new Error("lhs didnt compile???");
    }

    let expr: Sexpr;

    if (this.operator === SyntaxKind.PlusPlusToken) {
      expr = S.SetLocal(this.operandName, S.Add(exprCompiled.expr, 1));
    } else if (this.operator === SyntaxKind.MinusMinusToken) {
      expr = S.SetLocal(this.operandName, S.Sub(exprCompiled.expr, 1));
    } else {
      return assertNever(this.operator);
    }

    return {
      expr,
      functions: exprCompiled.functions,
    }
  }
}
