import { PostfixUnaryExpression, PostfixUnaryOperator, SyntaxKind } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flatArray, assertNever } from "../util";
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

    this.children = flatArray(
      this.expression = buildNode(scope, node.operand),
    );

    this.operandName = node.operand.getText();
  }

  compile(scope: Scope): Sexpr {
    // TODO: Check types! (mostly vs f32 etc)
    // TODO: Return previous value.
    // TODO: consider ++ vs --
    // TODO: Should use context to set local, it's safer

    const exprCompiled = this.expression.compile(scope);

    if (!exprCompiled) {
      throw new Error("lhs didnt compile???");
    }

    if (this.operator === SyntaxKind.PlusPlusToken) {
      return S.SetLocal(this.operandName, S.Add(exprCompiled, 1));
    } else if (this.operator === SyntaxKind.MinusMinusToken) {
      return S.SetLocal(this.operandName, S.Sub(exprCompiled, 1));
    } else {
      return assertNever(this.operator);
    }
  }
}
