import { Context } from "../context";
import {
  SyntaxKind,
  Expression,
  BinaryExpression,
  CallExpression,
  Identifier,
  NumericLiteral,
  ConditionalExpression,
  PostfixUnaryExpression,
  PrefixUnaryExpression,
  StringLiteral,
  AsExpression,
  PropertyAccessExpression,
  ParenthesizedExpression,
  ElementAccessExpression,
  ThisExpression
} from "typescript";
import { BSBinaryExpression } from "./binaryexpression";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSNumericLiteral } from "./numericliteral";
import { BSConditionalExpression } from "./conditionalexpression";
import { Sexpr, S } from "../sexpr";
import { BSPostfixUnaryExpression } from "./postfixunaryexpression";
import {
  parsePrefixUnaryExpression,
  BSPrefixUnaryExpression
} from "./prefixunaryexpression";
import { BSStringLiteral } from "./stringliteral";
import {
  parsePropertyAccess,
  BSPropertyAccessExpression
} from "./propertyaccess";
import { BSElementAccessExpression } from "./elementaccess";
import { BSThisKeyword } from "./this";
import { BSTrueKeyword } from "./true";
import { BSFalseKeyword } from "./false";
import { BSAsExpression } from "./as";
import { BSParenthesizedExpression } from "./parentheses";
import { BSNode } from "./bsnode";

/*
export class BSExpression extends BSNode {
  children: BSNode[];

  readonly type = "Expression";
  expression: BSNode;
  nodeREMOVE: Expression;

  constructor(ctx: Context, expression: Expression) {
    super();

    this.expression = this.getExpressionNode(ctx, expression);
    this.children = [this.expression];

    this.nodeREMOVE = expression;
  }

  compile(ctx: Context): Sexpr | null {
    return this.expression.compile(ctx);
  }
}
*/

/**
 * BSExpressionNode is a BSNode whos compile() always returns a Sexpr, not null.
 */ 
export type BSExpressionNode =
  | BSBinaryExpression
  | BSCallExpression
  | BSIdentifier
  | BSNumericLiteral
  | BSConditionalExpression
  | BSPostfixUnaryExpression
  | BSPrefixUnaryExpression
  | BSTrueKeyword
  | BSFalseKeyword
  | BSStringLiteral
  | BSAsExpression
  | BSParenthesizedExpression
  | BSPropertyAccessExpression
  | BSElementAccessExpression
  | BSThisKeyword;

export function getExpressionNode(
  ctx: Context,
  expression: Expression
): BSExpressionNode {
  switch (expression.kind) {
    case SyntaxKind.BinaryExpression:
      return new BSBinaryExpression(ctx, expression as BinaryExpression);
    case SyntaxKind.CallExpression:
      return new BSCallExpression(ctx, expression as CallExpression);
    case SyntaxKind.Identifier:
      return new BSIdentifier(ctx, expression as Identifier);
    case SyntaxKind.NumericLiteral:
      return new BSNumericLiteral(ctx, expression as NumericLiteral);
    case SyntaxKind.ConditionalExpression:
      return new BSConditionalExpression(
        ctx,
        expression as ConditionalExpression
      );
    case SyntaxKind.PostfixUnaryExpression:
      return new BSPostfixUnaryExpression(
        ctx,
        expression as PostfixUnaryExpression
      );
    case SyntaxKind.PrefixUnaryExpression:
      return new BSPrefixUnaryExpression(
        ctx,
        expression as PrefixUnaryExpression
      );
    case SyntaxKind.TrueKeyword:
      return new BSTrueKeyword(ctx, expression);
    case SyntaxKind.FalseKeyword:
      return new BSFalseKeyword(ctx, expression);
    case SyntaxKind.StringLiteral:
      return new BSStringLiteral(ctx, expression as StringLiteral);
    case SyntaxKind.AsExpression:
      return new BSAsExpression(ctx, expression as AsExpression);
    case SyntaxKind.ParenthesizedExpression:
      return new BSParenthesizedExpression(
        ctx,
        expression as ParenthesizedExpression
      );
    case SyntaxKind.PropertyAccessExpression:
      return new BSPropertyAccessExpression(
        ctx,
        expression as PropertyAccessExpression
      );
    case SyntaxKind.ElementAccessExpression:
      return new BSElementAccessExpression(
        ctx,
        expression as ElementAccessExpression
      );
    case SyntaxKind.ThisKeyword:
      return new BSThisKeyword(ctx, expression as ThisExpression);
    default:
      throw new Error(
        `Unhandled expression! ${
          SyntaxKind[expression.kind]
        } in ${expression.getText()}`
      );
  }
}

// TODO this is just a stopgap for the refactor. remove when there are no more
// nodeREMOVE properties.
export function parseExpression(
  ctx: Context,
  expression: Expression
): Sexpr | null {
  switch (expression.kind) {
    case SyntaxKind.BinaryExpression:
      return new BSBinaryExpression(
        ctx,
        expression as BinaryExpression
      ).compile(ctx);
    case SyntaxKind.CallExpression:
      return new BSCallExpression(ctx, expression as CallExpression).compile(
        ctx
      );
    case SyntaxKind.Identifier:
      return new BSIdentifier(ctx, expression as Identifier).compile(ctx);
    case SyntaxKind.NumericLiteral:
      return new BSNumericLiteral(ctx, expression as NumericLiteral).compile(
        ctx
      );
    case SyntaxKind.ConditionalExpression:
      return new BSConditionalExpression(
        ctx,
        expression as ConditionalExpression
      ).compile(ctx);
    case SyntaxKind.PostfixUnaryExpression:
      return new BSPostfixUnaryExpression(
        ctx,
        expression as PostfixUnaryExpression
      ).compile(ctx);
    case SyntaxKind.PrefixUnaryExpression:
      return parsePrefixUnaryExpression(
        ctx,
        expression as PrefixUnaryExpression
      );
    case SyntaxKind.TrueKeyword:
      return S.Const("i32", 1); // cant find correct type!
    case SyntaxKind.FalseKeyword:
      return S.Const("i32", 0); // cant find correct type!
    case SyntaxKind.StringLiteral:
      return new BSStringLiteral(ctx, expression as StringLiteral).compile(ctx);
    case SyntaxKind.AsExpression:
      return parseExpression(ctx, (expression as AsExpression).expression);
    case SyntaxKind.ParenthesizedExpression:
      return parseExpression(
        ctx,
        (expression as ParenthesizedExpression).expression
      );
    case SyntaxKind.PropertyAccessExpression:
      return parsePropertyAccess(ctx, expression as PropertyAccessExpression);
    case SyntaxKind.ElementAccessExpression:
      return new BSElementAccessExpression(
        ctx,
        expression as ElementAccessExpression
      ).compile(ctx);
    case SyntaxKind.ThisKeyword:
      return new BSThisKeyword(ctx, expression as ThisExpression).compile(ctx);
    default:
      throw new Error(
        `Unhandled expression! ${
          SyntaxKind[expression.kind]
        } in ${expression.getText()}`
      );
  }
}
