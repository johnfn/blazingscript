import {
  BinaryExpression,
  SyntaxKind,
  TypeFlags,
  AssignmentExpression,
  EqualsToken,
  Identifier,
  Type,
  BinaryOperator,
  Token
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { Operator } from "./method";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSIdentifier } from "./identifier";
import { getExpressionNode } from "./expression";

/**
 * e.g. const x = 1 + 3
 *                ^^^^^
 */
export class BSBinaryExpression extends BSNode {
  children: BSNode[];
  left: BSNode;
  right: BSNode;
  leftType: Type;
  rightType: Type;
  operatorToken: Token<BinaryOperator>;

  fullText: string;

  constructor(ctx: Context, node: BinaryExpression) {
    super(ctx, node);

    this.left = getExpressionNode(ctx, node.left);
    this.right = getExpressionNode(ctx, node.right);

    this.leftType = ctx.typeChecker.getTypeAtLocation(node.left);
    this.rightType = ctx.typeChecker.getTypeAtLocation(node.right);

    this.operatorToken = node.operatorToken;

    this.children = [this.left, this.right];
    this.fullText = node.getFullText();
  }

  compile(ctx: Context): Sexpr {
    const leftParsed = this.left.compile(ctx);
    const rightParsed = this.right.compile(ctx);

    if (!rightParsed) {
      throw new Error("rightParsed not defined asdkfjlh");
    }
    if (!leftParsed) {
      throw new Error("leftParsed not defined asdkfjlh");
    }

    if (this.operatorToken.kind === SyntaxKind.EqualsToken) {
      if (this.left instanceof BSIdentifier) {
        return S.SetLocal(this.left.text, rightParsed);
      } else {
        throw new Error(
          "literally no idea what to do with other types of LHSs in assignments!"
        );
      }
    }

    if (this.operatorToken.kind === SyntaxKind.EqualsEqualsToken) {
      throw new Error(
        `unsupported token == in : ${this.fullText} (hint: use ===)`
      );
    }

    if (this.operatorToken.kind === SyntaxKind.ExclamationEqualsToken) {
      throw new Error(
        `unsupported token == in : ${this.fullText} (hint: use ===)`
      );
    }

    // if (leftType.flags !== rightType.flags) {
    //   throw new Error(`in ${ be.getText() } both types must agree. (${ (leftType as any).intrinsicName }, ${ (rightType as any).intrinsicName })`);
    // }

    if (
      this.leftType.flags  & TypeFlags.NumberLike &&
      this.rightType.flags & TypeFlags.NumberLike
    ) {
      switch (this.operatorToken.kind) {
        case SyntaxKind.CommaToken:
          throw new Error(`unsupported binary expression ${this.fullText}`);
        case SyntaxKind.LessThanToken:
          return S("i32", "i32.lt_s", leftParsed, rightParsed);
        case SyntaxKind.GreaterThanToken:
          return S("i32", "i32.gt_s", leftParsed, rightParsed);
        case SyntaxKind.LessThanEqualsToken:
          return S("i32", "i32.le_s", leftParsed, rightParsed);
        case SyntaxKind.GreaterThanEqualsToken:
          return S("i32", "i32.ge_s", leftParsed, rightParsed);
        case SyntaxKind.EqualsEqualsEqualsToken:
          return S("i32", "i32.eq", leftParsed, rightParsed);
        case SyntaxKind.ExclamationEqualsEqualsToken:
          return S("i32", "i32.ne", leftParsed, rightParsed);
        case SyntaxKind.PercentToken:
          return S("i32", "i32.rem_s", leftParsed, rightParsed);
        case SyntaxKind.LessThanLessThanToken:
          return S("i32", "i32.shl", leftParsed, rightParsed);
        case SyntaxKind.GreaterThanGreaterThanToken:
          return S("i32", "i32.shr_s", leftParsed, rightParsed);
        case SyntaxKind.AmpersandToken:
          return S("i32", "i32.and", leftParsed, rightParsed);
        case SyntaxKind.BarToken:
          return S("i32", "i32.or", leftParsed, rightParsed);
        case SyntaxKind.CaretToken:
          return S("i32", "i32.xor", leftParsed, rightParsed);
        case SyntaxKind.PlusToken:
          return S("i32", "i32.add", leftParsed, rightParsed);
        case SyntaxKind.MinusToken:
          return S("i32", "i32.sub", leftParsed, rightParsed);
        case SyntaxKind.AsteriskToken:
          return S("i32", "i32.mul", leftParsed, rightParsed);
        case SyntaxKind.SlashToken:
          return S("i32", "i32.div_s", leftParsed, rightParsed);
        case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        case SyntaxKind.AsteriskAsteriskToken:
        case SyntaxKind.PlusEqualsToken:
        case SyntaxKind.MinusEqualsToken:
        case SyntaxKind.AsteriskEqualsToken:
        case SyntaxKind.AsteriskAsteriskEqualsToken:
        case SyntaxKind.SlashEqualsToken:
        case SyntaxKind.PercentEqualsToken:
        case SyntaxKind.LessThanLessThanEqualsToken:
        case SyntaxKind.GreaterThanGreaterThanEqualsToken:
        case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        case SyntaxKind.AmpersandEqualsToken:
        case SyntaxKind.BarEqualsToken:
        case SyntaxKind.CaretEqualsToken:
        case SyntaxKind.InKeyword:
          throw new Error(`unsupported binary expression ${this.fullText}`);
        default:
          throw new Error(`unknown binary expression ${this.fullText}`);
      }
    }

    if (
      this.leftType.flags  & TypeFlags.BooleanLike &&
      this.rightType.flags & TypeFlags.BooleanLike
    ) {
      switch (this.operatorToken.kind) {
        case SyntaxKind.EqualsEqualsEqualsToken:
          // TODO: Wrong in the case of true
          return S("i32", "i32.eq", leftParsed, rightParsed);
        case SyntaxKind.ExclamationEqualsEqualsToken:
          return S("i32", "i32.ne", leftParsed, rightParsed);
        case SyntaxKind.AmpersandAmpersandToken:
          // TODO: This is actually wrong (e.g. 1010 and 0101)
          return S("i32", "i32.and", leftParsed, rightParsed);
        case SyntaxKind.BarBarToken:
          throw new Error(`unsupported binary expression ${this.fullText}`);
        default:
          throw new Error(`unsupported binary expression ${this.fullText}`);
      }
    }

    if (
      this.leftType.flags & TypeFlags.StringLike &&
      this.rightType.flags & TypeFlags.StringLike
    ) {
      switch (this.operatorToken.kind) {
        case SyntaxKind.EqualsEqualsEqualsToken:
          return ctx.callMethodByOperator({
            className: ctx.getNativeTypeName("String"),
            opName: Operator["==="],
            thisExpr: this.left,
            argExprs: [this.right]
          });
        case SyntaxKind.ExclamationEqualsEqualsToken:
          return ctx.callMethodByOperator({
            className: ctx.getNativeTypeName("String"),
            opName: Operator["!=="],
            thisExpr: this.left,
            argExprs: [this.right]
          });
        case SyntaxKind.PlusToken:
          return ctx.callMethodByOperator({
            className: ctx.getNativeTypeName("String"),
            opName: Operator["+"],
            thisExpr: this.left,
            argExprs: [this.right]
          });
        default:
          throw new Error(`unsupported binary expression ${this.fullText}`);
      }
    }

    throw new Error(`unhandled types for binary expression ${this.fullText} ${ TypeFlags[this.leftType.flags] }.`);
  }
}

/*
full list

      case SyntaxKind.EqualsEqualsEqualsToken:
      case SyntaxKind.ExclamationEqualsEqualsToken:
      case SyntaxKind.AsteriskAsteriskToken:
      case SyntaxKind.PercentToken:
      case SyntaxKind.LessThanLessThanToken:
      case SyntaxKind.GreaterThanGreaterThanToken:
      case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      case SyntaxKind.CommaToken:
      case SyntaxKind.LessThanToken:
      case SyntaxKind.GreaterThanToken:
      case SyntaxKind.LessThanEqualsToken:
      case SyntaxKind.GreaterThanEqualsToken:
      case SyntaxKind.AmpersandToken:
      case SyntaxKind.BarToken:
      case SyntaxKind.CaretToken:
      case SyntaxKind.AmpersandAmpersandToken:
      case SyntaxKind.BarBarToken:
      case SyntaxKind.PlusEqualsToken:
      case SyntaxKind.MinusEqualsToken:
      case SyntaxKind.AsteriskEqualsToken:
      case SyntaxKind.AsteriskAsteriskEqualsToken:
      case SyntaxKind.SlashEqualsToken:
      case SyntaxKind.PercentEqualsToken:
      case SyntaxKind.LessThanLessThanEqualsToken:
      case SyntaxKind.GreaterThanGreaterThanEqualsToken:
      case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      case SyntaxKind.AmpersandEqualsToken:
      case SyntaxKind.BarEqualsToken:
      case SyntaxKind.CaretEqualsToken:
      case SyntaxKind.InKeyword:
      case SyntaxKind.InstanceOfKeyword:
      case SyntaxKind.PlusToken:
      case SyntaxKind.MinusToken:
      case SyntaxKind.AsteriskToken:
      case SyntaxKind.SlashToken:
*/
