import {
  BinaryExpression,
  SyntaxKind,
  TypeFlags,
  Type,
  BinaryOperator,
  Token
} from "typescript";
import { Sexpr, S, sexprToString } from "../sexpr";
import { Operator } from "./method";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSIdentifier } from "./identifier";
import { flatArray } from "../util";
import { buildNode } from "./nodeutil";
import { BSExpression } from "./expression";

/**
 * e.g. const x = 1 + 3
 *                ^^^^^
 */
export class BSBinaryExpression extends BSNode {
  children     : BSNode[];
  left         : BSExpression;
  right        : BSExpression;
  operatorToken: Token<BinaryOperator>;
  fullText     : string;

  constructor(ctx: Scope, node: BinaryExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.operatorToken = node.operatorToken;
    const nodeInfo: NodeInfo = { isLhs: false }

    if (node.operatorToken.kind === SyntaxKind.EqualsToken) {
      nodeInfo.isLhs = true;
    }

    this.children = flatArray(
      this.left  = buildNode(ctx, node.left, nodeInfo),
      this.right = buildNode(ctx, node.right),
    );

    this.fullText = node.getFullText();
  }

  compile(ctx: Scope): Sexpr {
    const leftParsed  = this.left.compile(ctx);
    const rightParsed = this.right.compile(ctx);

    if (this.operatorToken.kind === SyntaxKind.EqualsToken) {
      if (this.left instanceof BSIdentifier) {
        return S.SetLocal(this.left.text, rightParsed);
      } else {
        return S.Store(leftParsed, rightParsed);
      }
    }

    if (this.operatorToken.kind === SyntaxKind.EqualsEqualsToken) {
      throw new Error(`unsupported token == in : ${this.fullText} (hint: use ===)`);
    }

    if (this.operatorToken.kind === SyntaxKind.ExclamationEqualsToken) {
      throw new Error(`unsupported token == in : ${this.fullText} (hint: use ===)`);
    }

    // if (leftType.flags !== rightType.flags) {
    //   throw new Error(`in ${ be.getText() } both types must agree. (${ (leftType as any).intrinsicName }, ${ (rightType as any).intrinsicName })`);
    // }

    if (
      this.left.tsType.flags  & TypeFlags.NumberLike &&
      this.right.tsType.flags & TypeFlags.NumberLike
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
      this.left.tsType.flags  & TypeFlags.BooleanLike &&
      this.right.tsType.flags & TypeFlags.BooleanLike
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
      this.left.tsType.flags  & TypeFlags.StringLike &&
      this.right.tsType.flags & TypeFlags.StringLike
    ) {
      switch (this.operatorToken.kind) {
        case SyntaxKind.EqualsEqualsEqualsToken:
          return ctx.functions.callMethodByOperator({
            type    : this.left.tsType,
            opName  : Operator["==="],
            thisExpr: this.left,
            argExprs: [this.right]
          });
        case SyntaxKind.ExclamationEqualsEqualsToken:
          return ctx.functions.callMethodByOperator({
            type    : this.left.tsType,
            opName  : Operator["!=="],
            thisExpr: this.left,
            argExprs: [this.right]
          });
        case SyntaxKind.PlusToken:
          return ctx.functions.callMethodByOperator({
            type    : this.left.tsType,
            opName  : Operator["+"],
            thisExpr: this.left,
            argExprs: [this.right]
          });
        default:
          throw new Error(`unsupported binary expression ${this.fullText}`);
      }
    }

    throw new Error(`unhandled types for binary expression ${this.fullText} ${ TypeFlags[this.left.tsType.flags] }.`);
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
