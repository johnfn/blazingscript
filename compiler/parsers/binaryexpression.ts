import { BinaryExpression, SyntaxKind, BinaryOperator, TypeFlags, AssignmentExpression, EqualsToken, Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseExpression } from "./expression";
import { Context } from "../program";
import { Operator } from "./method";

export function parseBinaryExpression(ctx: Context, be: BinaryExpression): Sexpr {
  const leftType    = ctx.typeChecker.getTypeAtLocation(be.left);
  const rightType   = ctx.typeChecker.getTypeAtLocation(be.right);

  const leftParsed  = parseExpression(ctx, be.left);
  const rightParsed = parseExpression(ctx, be.right);

  if (be.operatorToken.kind === SyntaxKind.EqualsToken) {
    const f: AssignmentExpression<EqualsToken> = be as AssignmentExpression<EqualsToken>;

    if (f.left.kind === SyntaxKind.Identifier) {
      const id: Identifier = f.left as Identifier;

      return S.SetLocal(
        id.text,
        parseExpression(ctx, f.right)
      );
    } else {
      throw new Error("literally no idea what to do with other types of LHSs in assignments!")
    }
  }

  if (be.operatorToken.kind === SyntaxKind.EqualsEqualsToken) {
    throw new Error(`unsupported token == in : ${ be.getText() } (hint: use ===)`);
  }

  if (be.operatorToken.kind === SyntaxKind.ExclamationEqualsToken) {
    throw new Error(`unsupported token == in : ${ be.getText() } (hint: use ===)`);
  }

  // if (leftType.flags !== rightType.flags) {
  //   throw new Error(`in ${ be.getText() } both types must agree. (${ (leftType as any).intrinsicName }, ${ (rightType as any).intrinsicName })`);
  // }

  if ((leftType.flags & TypeFlags.NumberLike) && (rightType.flags & TypeFlags.NumberLike)) {
    switch (be.operatorToken.kind) {
      case SyntaxKind.CommaToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
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
      case SyntaxKind.AsteriskAsteriskToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.PercentToken:
        return S("i32", "i32.rem_s", leftParsed, rightParsed);
      case SyntaxKind.LessThanLessThanToken:
        return S("i32", "i32.shl", leftParsed, rightParsed);
      case SyntaxKind.GreaterThanGreaterThanToken:
        return S("i32", "i32.shr_s", leftParsed, rightParsed);
      case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.AmpersandToken:
        return S("i32", "i32.and", leftParsed, rightParsed);
      case SyntaxKind.BarToken:
        return S("i32", "i32.or", leftParsed, rightParsed);
      case SyntaxKind.CaretToken:
        return S("i32", "i32.xor", leftParsed, rightParsed);
      case SyntaxKind.PlusEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.MinusEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.AsteriskEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.AsteriskAsteriskEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.SlashEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.PercentEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.LessThanLessThanEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.GreaterThanGreaterThanEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.AmpersandEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.BarEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.CaretEqualsToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.InKeyword:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.InstanceOfKeyword:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      case SyntaxKind.PlusToken:
        return S("i32", "i32.add", leftParsed, rightParsed);
      case SyntaxKind.MinusToken:
        return S("i32", "i32.sub", leftParsed, rightParsed);
      case SyntaxKind.AsteriskToken:
        return S("i32", "i32.mul", leftParsed, rightParsed);
      case SyntaxKind.SlashToken:
        return S("i32", "i32.div_s", leftParsed, rightParsed);
      default:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
    }
  }

  if ((leftType.flags & TypeFlags.BooleanLike) && (rightType.flags & TypeFlags.BooleanLike)) {
    switch (be.operatorToken.kind) {
      case SyntaxKind.EqualsEqualsEqualsToken:
        // TODO: Wrong in the case of true
        return S("i32", "i32.eq", leftParsed, rightParsed);
      case SyntaxKind.ExclamationEqualsEqualsToken:
        return S("i32", "i32.ne", leftParsed, rightParsed);
      case SyntaxKind.AmpersandAmpersandToken:
        // TODO: This is actually wrong (e.g. 1010 and 0101)
        return S("i32", "i32.and", leftParsed, rightParsed);
      case SyntaxKind.BarBarToken:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
      default:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
    }
  }

  if ((leftType.flags & TypeFlags.StringLike) && (rightType.flags & TypeFlags.StringLike)) {
    switch (be.operatorToken.kind) {
      case SyntaxKind.EqualsEqualsEqualsToken:
        return ctx.callMethodByOperator({
          className: "__String",
          opName: Operator["==="],
          thisExpr: be.left,
          argExprs: [be.right],
        });
      case SyntaxKind.ExclamationEqualsEqualsToken:
        return ctx.callMethodByOperator({
          className: "__String",
          opName: Operator["!=="],
          thisExpr: be.left,
          argExprs: [be.right],
        });
      case SyntaxKind.PlusToken:
        return S(
          "i32", 
          "call", 
          "$__strCat", 
          leftParsed, 
          rightParsed
        );
      default:
        throw new Error(`unsupported binary expression ${ be.getText() }`);
    }
  }

  throw new Error(`unhandled types for binary expression ${ be.getText() }.`);
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