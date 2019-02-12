import { PrefixUnaryExpression, SyntaxKind, PrefixUnaryOperator } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. myFunction(++x);
 *                 ^^^
 */
export class BSPrefixUnaryExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;
  operator  : PrefixUnaryOperator;

  constructor(scope: Scope, node: PrefixUnaryExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flatArray(
      this.expression = buildNode(scope, node.operand),
    );

    this.operator = node.operator;
  }

  compile(scope: Scope): Sexpr {
    switch (this.operator) {
      case SyntaxKind.ExclamationToken:
        return S("i32", "i32.eqz", this.expression.compile(scope));
      case SyntaxKind.MinusToken:
        return S(
          "i32",
          "i32.sub",
          S.Const(0),
          this.expression.compile(scope)
        );
      case SyntaxKind.PlusPlusToken:
      case SyntaxKind.MinusMinusToken:
      case SyntaxKind.PlusToken:
      case SyntaxKind.TildeToken:
        throw new Error(`unhandled unary prefix ${this.fullText}`);
    }
  }
}