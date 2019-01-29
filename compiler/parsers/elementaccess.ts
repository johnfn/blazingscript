import {
  PropertyAccessExpression,
  TypeFlags,
  ElementAccessExpression
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { getExpressionNode, BSExpression } from "./expression";
import { Operator } from "./method";
import { isArrayType } from "./arrayliteral";

/**
 * e.g. const x = myArray[5];
 *                ^^^^^^^^^^^
 */
export class BSElementAccessExpression extends BSNode {
  children: BSNode[];
  element : BSExpression;
  argument: BSExpression;

  fullText: string;

  constructor(ctx: Context, node: ElementAccessExpression) {
    super(ctx, node);

    this.element  = getExpressionNode(ctx, node.expression);
    this.argument = getExpressionNode(ctx, node.argumentExpression);

    this.children = [this.element, this.argument];

    this.fullText = node.getFullText();
  }

  compile(ctx: Context): Sexpr {
    const arg = this.argument;
    const array = this.element;
    const arrayType = this.element.tsType;

    if (arrayType.flags & TypeFlags.StringLike) {
      return ctx.callMethodByOperator({
        className: ctx.getNativeTypeName("String"),
        opName   : Operator["[]"],
        thisExpr : array,
        argExprs : [arg]
      });
    }

    if (isArrayType(ctx, arrayType)) {
      return ctx.callMethodByOperator({
        className: ctx.getNativeTypeName("Array"),
        opName   : Operator["[]"],
        thisExpr : array,
        argExprs : [arg]
      });
    }

    throw new Error(`Dont know how to index into anything other than strings and arrays. ${ this.fullText } ${arrayType.flags}`);
  }
}
