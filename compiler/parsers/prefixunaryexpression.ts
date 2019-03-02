import { PrefixUnaryExpression, SyntaxKind, PrefixUnaryOperator } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";

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

    this.children = flattenArray(
      this.expression = buildNode(scope, node.operand),
    );

    this.operator = node.operator;
  }

  compile(scope: Scope): CompileResultExpr {
    const exprCompiled = this.expression.compile(scope);
    let expr: Sexpr;

    switch (this.operator) {
      case SyntaxKind.ExclamationToken:
        expr = S("i32", "i32.eqz", exprCompiled.expr);
        break;
      case SyntaxKind.MinusToken:
        expr = S(
          "i32",
          "i32.sub",
          S.Const(0),
          exprCompiled.expr
        );
        break;
      case SyntaxKind.PlusPlusToken:
      case SyntaxKind.MinusMinusToken:
      case SyntaxKind.PlusToken:
      case SyntaxKind.TildeToken:
        throw new Error(`unhandled unary prefix ${this.fullText}`);
      default:
        throw new Error(`unhandled unary prefix ${this.fullText}`);
    }

    return {
      expr,
      functions: exprCompiled.functions,
    };
  }
}