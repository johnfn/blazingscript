import {
  PropertyAccessExpression,
  TypeFlags,
  ElementAccessExpression
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
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

  constructor(ctx: Scope, node: ElementAccessExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.element  = buildNode(ctx, node.expression),
      this.argument = buildNode(ctx, node.argumentExpression),
    );

    this.fullText = node.getFullText();
  }

  compile(ctx: Scope): Sexpr {
    const arg = this.argument;
    const array = this.element;
    const arrayType = this.element.tsType;

    return ctx.functions.callMethodByOperator({
      type    : arrayType,
      opName  : Operator.ArrayIndex,
      thisExpr: array,
      argExprs: [arg]
    });
  }
}
