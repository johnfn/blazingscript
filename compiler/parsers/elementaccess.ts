import { ElementAccessExpression, TypeFlags } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { flattenArray } from "../util";
import { buildNode } from "./nodeutil";
import { isArrayType } from "./arrayliteral";
import { Operator } from "../scope/functions";

/**
 * e.g. const x = myArray[5];
 *                ^^^^^^^^^^^
 */
export class BSElementAccessExpression extends BSNode {
  children : BSNode[];
  array    : BSExpression;
  index    : BSExpression;

  isLhs = false;

  constructor(scope: Scope, node: ElementAccessExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.isLhs = info.isLhs || false;

    this.children = flattenArray(
      this.array = buildNode(scope, node.expression, { isLhs: true }),
      this.index = buildNode(scope, node.argumentExpression),
    );
  }

  compile(scope: Scope): Sexpr {
    const arrayType = this.array.tsType;

    if (arrayType.symbol && arrayType.symbol.name === "BuiltInArray") {
      const expr = S.Add(this.array.compile(scope), S.Mul(this.index.compile(scope), 4));

      if (this.isLhs) {
        return expr;
      } else {
        return S.Load("i32", expr);
      }
    }

    const expr = scope.functions.callMethodByOperator({
      type    : arrayType,
      opName  : Operator.ArrayIndex,
      scope   : scope,
      thisExpr: this.array,
      argExprs: [this.index],
    });

    if (
      isArrayType(scope, this.array.tsType)
    ) {
      if (this.isLhs) {
        return expr;
      } else {
        return S.Load("i32", expr);
      }
    }

    // you can't assign to a string by index, so they're never the lhs.

    // Also, a string element access being an LHS wouldn't work in the
    // conventional way because str[0] isn't a pointer - it actually creates a
    // new string and returns it.
    if (this.array.tsType.flags & TypeFlags.StringLike) {
      return expr;
    }

    throw new Error("Do not know how to access the element of that.");
  }
}
