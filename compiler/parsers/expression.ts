import { Context } from "../program";
import { SyntaxKind, Expression, BinaryExpression, CallExpression, Identifier, NumericLiteral, ConditionalExpression, PostfixUnaryExpression, PrefixUnaryExpression, StringLiteral, AsExpression } from "typescript";
import { parseBinaryExpression } from "./binaryexpression";
import { parseCallExpression } from "./callexpression";
import { parseIdentifier } from "./identifier";
import { parseNumericLiteral } from "./numericliteral";
import { parseConditionalExpression } from "./conditionalexpression";
import { Sexpr, S } from "../sexpr";
import { parsePostfixUnaryExpression } from "./postfixunaryexpression";
import { parsePrefixUnaryExpression } from "./prefixunaryexpression";
import { parseStringLiteral } from "./stringliteral";

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
      const foo = expression as AsExpression;
      return parseExpression(ctx, foo.expression);
    default:
    throw new Error(`Unhandled expression! ${ SyntaxKind[expression.kind] }`);
  }
}
