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

export type BSPropertyName =
  | BSIdentifier
  | BSStringLiteral
  | BSNumericLiteral
  // | BSComputedPropertyName;

export type BSBindingName = BSIdentifier // | BindingPattern;