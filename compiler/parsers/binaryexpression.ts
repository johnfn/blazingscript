import {
  BinaryExpression,
  SyntaxKind,
  TypeFlags,
  Type,
  BinaryOperator,
  Token
} from "typescript";
import { Sexpr, S, sexprToString } from "../sexpr";
import { Scope } from "../scope/scope";
import { Function } from "../scope/functions";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSIdentifier } from "./identifier";
import { flattenArray } from "../util";
import { buildNode } from "./nodeutil";
import { BSExpression } from "./expression";
import { Operator } from "../scope/functions";

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

  constructor(scope: Scope, node: BinaryExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.operatorToken = node.operatorToken;
    const nodeInfo: NodeInfo = { isLhs: false }

    if (node.operatorToken.kind === SyntaxKind.EqualsToken) {
      nodeInfo.isLhs = true;
    }

    this.children = flattenArray(
      this.left  = buildNode(scope, node.left, nodeInfo),
      this.right = buildNode(scope, node.right),
    );

    this.fullText = node.getFullText();
  }

  compile(scope: Scope): CompileResultExpr {
    const leftParsed  = this.left.compile(scope);
    const rightParsed = this.right.compile(scope);

    if (this.operatorToken.kind === SyntaxKind.EqualsToken) {
      if (this.left instanceof BSIdentifier) {
        return {
          expr   : S.SetLocal(this.left.text, rightParsed.expr),
          functions: rightParsed.functions,
        };
      } else {
        return {
          expr: S.Store(leftParsed.expr, rightParsed.expr),
          functions: [...leftParsed.functions, ...rightParsed.functions],
        };
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

    // Binary operations on integers

    if (
      this.left.tsType.flags  & TypeFlags.NumberLike &&
      this.right.tsType.flags & TypeFlags.NumberLike
    ) {
      let expr: Sexpr;

      switch (this.operatorToken.kind) {
        case SyntaxKind.LessThanToken               : expr = S("i32", "i32.lt_s" , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.GreaterThanToken            : expr = S("i32", "i32.gt_s" , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.LessThanEqualsToken         : expr = S("i32", "i32.le_s" , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.GreaterThanEqualsToken      : expr = S("i32", "i32.ge_s" , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.EqualsEqualsEqualsToken     : expr = S("i32", "i32.eq"   , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.ExclamationEqualsEqualsToken: expr = S("i32", "i32.ne"   , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.PercentToken                : expr = S("i32", "i32.rem_s", leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.LessThanLessThanToken       : expr = S("i32", "i32.shl"  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.GreaterThanGreaterThanToken : expr = S("i32", "i32.shr_s", leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.AmpersandToken              : expr = S("i32", "i32.and"  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.BarToken                    : expr = S("i32", "i32.or "  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.CaretToken                  : expr = S("i32", "i32.xor"  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.PlusToken                   : expr = S("i32", "i32.add"  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.MinusToken                  : expr = S("i32", "i32.sub"  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.AsteriskToken               : expr = S("i32", "i32.mul"  , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.SlashToken                  : expr = S("i32", "i32.div_s", leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        case SyntaxKind.CommaToken:
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
          console.log("?");
          throw new Error(`unsupported binary expression ${this.fullText}`);
        default:
          throw new Error(`unknown binary expression ${this.fullText}`);
      }

      return {
        expr,
        functions: [...leftParsed.functions, ...rightParsed.functions],
      };
    }

    // Binary operations on booleans

    if (
      this.left.tsType.flags  & TypeFlags.BooleanLike &&
      this.right.tsType.flags & TypeFlags.BooleanLike
    ) {
      let expr: Sexpr;

      switch (this.operatorToken.kind) {
        // TODO: Wrong in the case of true
        case SyntaxKind.EqualsEqualsEqualsToken     : expr = S("i32", "i32.eq" , leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.ExclamationEqualsEqualsToken: expr = S("i32", "i32.ne" , leftParsed.expr, rightParsed.expr); break;
          // TODO: This is actually wrong (e.g. 1010 and 0101)
        case SyntaxKind.AmpersandAmpersandToken     : expr = S("i32", "i32.and", leftParsed.expr, rightParsed.expr); break;
        case SyntaxKind.BarBarToken:
        default:
          throw new Error(`unsupported binary expression ${this.fullText}`);
      }

      return {
        expr,
        functions: [...leftParsed.functions, ...rightParsed.functions],
      };
    }

    if (
      this.left.tsType.flags  & TypeFlags.StringLike &&
      this.right.tsType.flags & TypeFlags.StringLike
    ) {
      let fn: Function;

      switch (this.operatorToken.kind) {
        case SyntaxKind.EqualsEqualsEqualsToken: 
          fn = scope.functions.getByOperator(this.left.tsType, Operator["==="]);
          break;
        case SyntaxKind.ExclamationEqualsEqualsToken: 
          fn = scope.functions.getByOperator(this.left.tsType, Operator["!=="]);
          break;
        case SyntaxKind.PlusToken:
          fn = scope.functions.getByOperator(this.left.tsType, Operator["+"]);
          break;
        default:
          throw new Error(`unsupported binary expression ${this.fullText}`);
      }

      const leftCompiled  = this.left.compile(scope);
      const rightCompiled = this.right.compile(scope);

      return {
        expr     : S.CallWithThis(fn, leftCompiled.expr, rightCompiled.expr),
        functions: [...leftCompiled.functions, ...rightCompiled.functions],
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
