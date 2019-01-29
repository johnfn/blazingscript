import { PrefixUnaryExpression, SyntaxKind, PrefixUnaryOperator } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { getExpressionNode, BSExpression } from "./expression";

/**
 * e.g. console.log(++x);
 *                  ^^^
 */
export class BSPrefixUnaryExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;
  operator  : PrefixUnaryOperator;

  constructor(ctx: Context, node: PrefixUnaryExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.operand);
    this.children = [this.expression];
    this.operator = node.operator;
  }

  compile(ctx: Context): Sexpr {
    switch (this.operator) {
      case SyntaxKind.ExclamationToken:
        return S("i32", "i32.eqz", this.expression.compile(ctx));
      case SyntaxKind.MinusToken:
        return S(
          "i32",
          "i32.sub",
          S.Const(0),
          this.expression.compile(ctx)
        );
      case SyntaxKind.PlusPlusToken:
      case SyntaxKind.MinusMinusToken:
      case SyntaxKind.PlusToken:
      case SyntaxKind.TildeToken:
        throw new Error(`unhandled unary prefix ${this.fullText}`);
    }
  }
}