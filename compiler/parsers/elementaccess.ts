import {
  PropertyAccessExpression,
  TypeFlags,
  ElementAccessExpression
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../scope/context";
import { BSNode } from "./bsnode";
import { BSExpression } from "./expression";
import { Operator } from "./method";
import { isArrayType } from "./arrayliteral";
import { flatArray } from "../util";
import { buildNode } from "./nodeutil";

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

    this.children = flatArray(
      this.element  = buildNode(ctx, node.expression),
      this.argument = buildNode(ctx, node.argumentExpression),
    );

    this.fullText = node.getFullText();
  }

  compile(ctx: Context): Sexpr {
    const arg = this.argument;
    const array = this.element;
    const arrayType = this.element.tsType;

    return ctx.scope.functions.callMethodByOperator({
      type    : arrayType,
      opName  : Operator["[]"],
      thisExpr: array,
      argExprs: [arg]
    });
  }
}
