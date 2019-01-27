import { Context } from "../context";
import { SyntaxKind, Expression, BinaryExpression, CallExpression, Identifier, NumericLiteral, ConditionalExpression, PostfixUnaryExpression, PrefixUnaryExpression, StringLiteral, AsExpression, PropertyAccessExpression, ParenthesizedExpression, ElementAccessExpression, ThisExpression } from "typescript";
import { parseBinaryExpression, BSBinaryExpression } from "./binaryexpression";
import { parseCallExpression, BSCallExpression } from "./callexpression";
import { parseIdentifier, BSIdentifier } from "./identifier";
import { parseNumericLiteral, BSNumericLiteral } from "./numericliteral";
import { parseConditionalExpression, BSConditionalExpression } from "./conditionalexpression";
import { Sexpr, S } from "../sexpr";
import { parsePostfixUnaryExpression, BSPostfixUnaryExpression } from "./postfixunaryexpression";
import { parsePrefixUnaryExpression, BSPrefixUnaryExpression } from "./prefixunaryexpression";
import { parseStringLiteral, BSStringLiteral } from "./stringliteral";
import { parsePropertyAccess, BSPropertyAccessExpression } from "./propertyaccess";
import { parseElementAccess, BSElementAccessExpression } from "./elementaccess";
import { parseThisKeyword, BSThisKeyword } from "./this";
import { BSNode } from "../rewriter";
import { BSTrueKeyword } from "./true";
import { BSFalseKeyword } from "./false";
import { BSAsExpression } from "./as";
import { BSParenthesizedExpression } from "./parentheses";

export class BSExpression extends BSNode {
  children: BSNode[];

  readonly type = "Expression";
  expression: BSNode;

  constructor(expression: Expression) {
    super();

    this.expression = this.getExpressionNode(expression);
    this.children = [this.expression];
  }

  getExpressionNode(expression: Expression): BSNode {
    switch (expression.kind) {
      case SyntaxKind.BinaryExpression:
        return new BSBinaryExpression(expression as BinaryExpression);
      case SyntaxKind.CallExpression:
        return new BSCallExpression(expression as CallExpression);
      case SyntaxKind.Identifier:
        return new BSIdentifier(expression as Identifier);
      case SyntaxKind.NumericLiteral:
        return new BSNumericLiteral(expression as NumericLiteral);
      case SyntaxKind.ConditionalExpression:
        return new BSConditionalExpression(expression as ConditionalExpression);
      case SyntaxKind.PostfixUnaryExpression:
        return new BSPostfixUnaryExpression(expression as PostfixUnaryExpression);
      case SyntaxKind.PrefixUnaryExpression:
        return new BSPrefixUnaryExpression(expression as PrefixUnaryExpression);
      case SyntaxKind.TrueKeyword:
        return new BSTrueKeyword(); // S.Const("i32", 1); // cant find correct type!
      case SyntaxKind.FalseKeyword:
        return new BSFalseKeyword() // S.Const("i32", 0); // cant find correct type!
      case SyntaxKind.StringLiteral:
        return new BSStringLiteral(expression as StringLiteral);
      case SyntaxKind.AsExpression:
        return new BSAsExpression(expression as AsExpression);
      case SyntaxKind.ParenthesizedExpression:
        return new BSParenthesizedExpression(expression as ParenthesizedExpression);
      case SyntaxKind.PropertyAccessExpression:
        return new BSPropertyAccessExpression(expression as PropertyAccessExpression);
      case SyntaxKind.ElementAccessExpression:
        return new BSElementAccessExpression(expression as ElementAccessExpression);
      case SyntaxKind.ThisKeyword:
        return new BSThisKeyword(expression as ThisExpression);
      default:
        throw new Error(`Unhandled expression! ${ SyntaxKind[expression.kind] } in ${ expression.getText() }`);
    }
  }
}

export function parseExpression(ctx: Context, expression: Expression): Sexpr {
  switch (expression.kind) {
    case SyntaxKind.BinaryExpression:
      return parseBinaryExpression(ctx, expression as BinaryExpression);
    case SyntaxKind.CallExpression:
      return parseCallExpression(ctx, expression as CallExpression);
    case SyntaxKind.Identifier:
      return parseIdentifier(ctx, expression as Identifier);
    case SyntaxKind.NumericLiteral:
      return parseNumericLiteral(ctx, expression as NumericLiteral);
    case SyntaxKind.ConditionalExpression:
      return parseConditionalExpression(ctx, expression as ConditionalExpression);
    case SyntaxKind.PostfixUnaryExpression:
      return parsePostfixUnaryExpression(ctx, expression as PostfixUnaryExpression);
    case SyntaxKind.PrefixUnaryExpression:
      return parsePrefixUnaryExpression(ctx, expression as PrefixUnaryExpression);
    case SyntaxKind.TrueKeyword:
      return S.Const("i32", 1); // cant find correct type!
    case SyntaxKind.FalseKeyword:
      return S.Const("i32", 0); // cant find correct type!
    case SyntaxKind.StringLiteral:
      return parseStringLiteral(ctx, expression as StringLiteral);
    case SyntaxKind.AsExpression:
      return parseExpression(ctx, (expression as AsExpression).expression);
    case SyntaxKind.ParenthesizedExpression:
      return parseExpression(ctx, (expression as ParenthesizedExpression).expression);
    case SyntaxKind.PropertyAccessExpression:
      return parsePropertyAccess(ctx, expression as PropertyAccessExpression);
    case SyntaxKind.ElementAccessExpression:
      return parseElementAccess(ctx, expression as ElementAccessExpression);
    case SyntaxKind.ThisKeyword:
      return parseThisKeyword(ctx, expression as ThisExpression);
    default:
    throw new Error(`Unhandled expression! ${ SyntaxKind[expression.kind] } in ${ expression.getText() }`);
  }
}
