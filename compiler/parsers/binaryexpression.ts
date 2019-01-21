import { BinaryExpression, SyntaxKind, BinaryOperator, TypeFlags, AssignmentExpression, EqualsToken, Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseExpression } from "./expression";
import { Context } from "../program";

export function parseBinaryExpression(ctx: Context, be: BinaryExpression): Sexpr {
  const type = ctx.typeChecker.getTypeAtLocation(be.left);
  let fn: string | undefined;

  if ((type.flags & TypeFlags.Number) || type.isNumberLiteral() || (type.flags && TypeFlags.Boolean)) {
    const functionMapping: { [key in BinaryOperator]: string | undefined } = {
      [SyntaxKind.CommaToken]: undefined,
      [SyntaxKind.LessThanToken]: "i32.gt_s",
      [SyntaxKind.GreaterThanToken]: undefined,
      [SyntaxKind.LessThanEqualsToken]: undefined,
      [SyntaxKind.GreaterThanEqualsToken]: undefined,
      [SyntaxKind.EqualsEqualsToken]: undefined,
      [SyntaxKind.EqualsEqualsEqualsToken]: "i32.eq",
      [SyntaxKind.ExclamationEqualsToken]: undefined,
      [SyntaxKind.ExclamationEqualsEqualsToken]: undefined,
      [SyntaxKind.AsteriskAsteriskToken]: undefined,
      [SyntaxKind.PercentToken]: undefined,
      [SyntaxKind.LessThanLessThanToken]: undefined,
      [SyntaxKind.GreaterThanGreaterThanToken]: undefined,
      [SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: undefined,
      [SyntaxKind.AmpersandToken]: undefined,
      [SyntaxKind.BarToken]: undefined,
      [SyntaxKind.CaretToken]: undefined,
      [SyntaxKind.AmpersandAmpersandToken]: "i32.and",
      [SyntaxKind.BarBarToken]: undefined,
      [SyntaxKind.EqualsToken]: undefined,
      [SyntaxKind.PlusEqualsToken]: undefined,
      [SyntaxKind.MinusEqualsToken]: undefined,
      [SyntaxKind.AsteriskEqualsToken]: undefined,
      [SyntaxKind.AsteriskAsteriskEqualsToken]: undefined,
      [SyntaxKind.SlashEqualsToken]: undefined,
      [SyntaxKind.PercentEqualsToken]: undefined,
      [SyntaxKind.LessThanLessThanEqualsToken]: undefined,
      [SyntaxKind.GreaterThanGreaterThanEqualsToken]: undefined,
      [SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]: undefined,
      [SyntaxKind.AmpersandEqualsToken]: undefined,
      [SyntaxKind.BarEqualsToken]: undefined,
      [SyntaxKind.CaretEqualsToken]: undefined,
      [SyntaxKind.InKeyword]: undefined,
      [SyntaxKind.InstanceOfKeyword]: undefined,

      [SyntaxKind.PlusToken]: "i32.add",
      [SyntaxKind.MinusToken]: "i32.sub",
      [SyntaxKind.AsteriskToken]: "i32.mul",
      [SyntaxKind.SlashToken]: "i32.div",
    };

    if (!(be.operatorToken.kind in functionMapping)) {
      throw new Error(`Unhandled binary operation! ${be.operatorToken.kind}`)
    }

    fn = functionMapping[be.operatorToken.kind];
  } else {
    throw new Error(`Dunno how to add that gg. ${(type as any).intrinsicName}`);
  }

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
  
  if (fn === undefined) {
    throw new Error(`Unsupported binary operation: ${SyntaxKind[be.operatorToken.kind]} in ${ be.getText() }`);
  }

  return S(
    "i32",
    fn,
    parseExpression(ctx, be.left),
    parseExpression(ctx, be.right),
  );
}
