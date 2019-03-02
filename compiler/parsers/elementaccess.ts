import { ElementAccessExpression, TypeFlags } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { flattenArray } from "../util";
import { buildNode } from "./nodeutil";
import { isArrayType } from "./arrayliteral";
import { Operator } from "../scope/functions";

/**
 * e.g. const x = myArray[5];
 *                ^^^^^^^^^^^
 * 
 * also e.g. myArray[2] = "hello";
 *           ^^^^^^^^^^
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

  compile(scope: Scope): CompileResultExpr {
    const arrayType     = this.array.tsType;

    const thisCompiled  = this.array.compile(scope);
    const indexCompiled = this.index.compile(scope);

    let expr: Sexpr | null = null;

    if (arrayType.symbol && arrayType.symbol.name === "BuiltInArray") {
      expr = S.Add(thisCompiled.expr, S.Mul(indexCompiled.expr, 4));

      if (!this.isLhs) {
        expr = S.Load("i32", expr);
      }
    } else {
      const fn = scope.functions.getByOperator(arrayType, Operator["[]"]);
      
      if (
        isArrayType(this.array.tsType)
      ) {
        if (this.isLhs) {
          expr = S.CallWithThis(fn, thisCompiled.expr, indexCompiled.expr);
        } else {
          expr = S.Load("i32", S.CallWithThis(fn, thisCompiled.expr, indexCompiled.expr));
        }
      }

      // you can't assign to a string by index, so they're never the lhs.

      // Also, a string element access being an LHS wouldn't work in the
      // conventional way because str[0] isn't a pointer - it actually creates a
      // new string and returns it.
      if (this.array.tsType.flags & TypeFlags.StringLike) {
        expr = S.CallWithThis(fn, thisCompiled.expr, indexCompiled.expr);
      }
    }

    if (expr !== null) {
      return {
        expr,
        functions: [...thisCompiled.functions, ...indexCompiled.functions],
      };
    }

    throw new Error("Do not know how to access the element of that.");
  }
}
