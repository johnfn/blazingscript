import { Context } from "../program";
import { CallExpression, SyntaxKind, TypeFlags } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { flatten } from "../rewriter";
import { parseExpression } from "./expression";

export function parseCallExpression(ctx: Context, ce: CallExpression): Sexpr {
  // TODO: I actualy have to resolve the lhs
  // tho to be fair, i dont know how to call anything at all rn.

  if (ce.expression.getText() === "console.log") {
    if (ce.arguments.length !== 1) {
      throw new Error("unhandled log w/o 1 arg");
    }

    return S(
      "[]",
      "call",
      "$log",
      parseExpression(ctx, ce.arguments[0]),
    );
  } else if (ce.expression.getText() === "mset") {
    return S.Store(
      parseExpression(ctx, ce.arguments[0]),
      parseExpression(ctx, ce.arguments[1]),
    );
  } else if (ce.expression.getText() === "mget") {
    return S.Load(
      "i32",
      parseExpression(ctx, ce.arguments[0]),
    );
  } else if (ce.expression.getText() === "clog") {
    const logArgs: {
      size: Sexpr;
      start: Sexpr;
      type: number;
      putValueInMemory: Sexpr[];
    }[] = [];

    let offset = 0;

    for (const arg of ce.arguments) {
      if (arg.kind === SyntaxKind.StringLiteral) {
        const str = arg.getText().slice(1, -1);

        logArgs.push({
          size: S.Const("i32", str.length),
          start: S.Const("i32", offset),
          type: 0,
          putValueInMemory: Sx.SetStringLiteralAt(offset, str),
        });

        offset += str.length;
      } else if (arg.kind === SyntaxKind.NumericLiteral) {
        const num = Number(arg.getText());

        logArgs.push({
          size: S.Const("i32", 4),
          start: S.Const("i32", offset),
          type: 1,
          putValueInMemory: [
            S.Store(
              S.Const("i32", offset),
              S.Const("i32", num)
            )
          ],
        });

        offset += 4;
      } else if (arg.kind === SyntaxKind.Identifier) {
        const type = ctx.typeChecker.getTypeAtLocation(arg);

        if (type.flags & TypeFlags.String || type.flags & TypeFlags.StringLiteral) {
          logArgs.push({
            size: S.Load("i32", S.GetLocal("i32", arg.getText())),
            start: S.GetLocal("i32", arg.getText()),
            type: 2,
            putValueInMemory: [
              S.Store(
                S.Const("i32", offset),
                S.GetLocal("i32", arg.getText()),
              )
            ],
          });
        } else if (type.flags & TypeFlags.Number) {
          logArgs.push({
            size: S.Const("i32", 4),
            start: S.Const("i32", offset),
            type: 1,
            putValueInMemory: [
              S.Store(
                S.Const("i32", offset),
                S.GetLocal("i32", arg.getText()),
              )
            ],
          });
        } else {
          throw new Error(`dont know how to clog that!! ${TypeFlags[type.flags]}... ${type.flags & TypeFlags.String} in ${arg.getText()}`);
        }

        offset += 4;
      } else {
        logArgs.push({
          size: S.Const("i32", 4),
          start: S.Const("i32", offset),
          type: 1,
          putValueInMemory: [
            S.Store(
              S.Const("i32", offset),
              parseExpression(ctx, arg),
            )
          ],
        });

        offset += 4;
      }
    }

    while (logArgs.length < 3) {
      logArgs.push({
        size: S.Const("i32", 0),
        start: S.Const("i32", 0),
        type: 9999,
        putValueInMemory: [S("[]", "nop")],
      });
    }

    return S.Wrap(
      "i32", [
        // store all args into memory

        ...flatten(logArgs.map(obj => obj.putValueInMemory)),

        S(
          "[]",
          "call",
          "$clog",
          ...flatten(
            logArgs.map(obj => [
              S.Const("i32", obj.type),
              obj.start,
              S("i32", "i32.add", obj.start, obj.size),
            ])
          ),
        ),
        S.Const("i32", 0)
      ]
    );
  } else {
    return S(
      "i32",
      "call", "$" + ce.expression.getText(),
      ...ce.arguments.map(arg => parseExpression(ctx, arg))
    )
  }
}
