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
  ThisExpression,
  ArrayLiteralExpression
} from "typescript";
import { BSBinaryExpression } from "./binaryexpression";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSNumericLiteral } from "./numericliteral";
import { BSConditionalExpression } from "./conditionalexpression";
import { BSPostfixUnaryExpression } from "./postfixunaryexpression";
import { BSPrefixUnaryExpression } from "./prefixunaryexpression";
import { BSStringLiteral } from "./stringliteral";
import { BSPropertyAccessExpression } from "./propertyaccess";
import { BSElementAccessExpression } from "./elementaccess";
import { BSThisKeyword } from "./this";
import { BSTrueKeyword } from "./true";
import { BSFalseKeyword } from "./false";
import { BSAsExpression } from "./as";
import { BSParenthesizedExpression } from "./parentheses";
import { BSArrayLiteral } from "./arrayliteral";
import { S } from "../sexpr";

/**
 * BSExpressionNode is a BSNode whos compile() always returns a Sexpr, not null.
 */ 
export type BSExpression =
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
): BSExpression {
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
      return new BSConditionalExpression(ctx, expression as ConditionalExpression);
    case SyntaxKind.PostfixUnaryExpression:
      return new BSPostfixUnaryExpression(ctx, expression as PostfixUnaryExpression);
    case SyntaxKind.PrefixUnaryExpression:
      return new BSPrefixUnaryExpression(ctx, expression as PrefixUnaryExpression);
    case SyntaxKind.TrueKeyword:
      return new BSTrueKeyword(ctx, expression);
    case SyntaxKind.FalseKeyword:
      return new BSFalseKeyword(ctx, expression);
    case SyntaxKind.StringLiteral:
      return new BSStringLiteral(ctx, expression as StringLiteral);
    case SyntaxKind.AsExpression:
      return new BSAsExpression(ctx, expression as AsExpression);
    case SyntaxKind.ParenthesizedExpression:
      return new BSParenthesizedExpression(ctx, expression as ParenthesizedExpression);
    case SyntaxKind.PropertyAccessExpression:
      return new BSPropertyAccessExpression(ctx, expression as PropertyAccessExpression);
    case SyntaxKind.ElementAccessExpression:
      return new BSElementAccessExpression(ctx, expression as ElementAccessExpression);
    case SyntaxKind.ThisKeyword:
      return new BSThisKeyword(ctx, expression as ThisExpression);
    case SyntaxKind.ArrayLiteralExpression:
      return new BSArrayLiteral(ctx, expression as ArrayLiteralExpression);
    default:
      throw new Error(`Unhandled expression! ${ SyntaxKind[expression.kind] } in ${expression.getText()}`);
  }
}