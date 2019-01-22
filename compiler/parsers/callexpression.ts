import { Context } from "../program";
import { CallExpression, SyntaxKind, TypeFlags, PropertyAccessExpression } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { flatten } from "../rewriter";
import { parseExpression } from "./expression";

export function parseCallExpression(ctx: Context, ce: CallExpression): Sexpr {
  // TODO: This is wrong, I actualy have to resolve the lhs
  // tho to be fair, i dont know how to call anything at all rn.

  const functionName = ce.expression.getText()
  const special = handleSpecialFunctions(ctx, functionName, ce);

  if (special !== null) {
    return special;
  }

  return S(
    "i32",
    "call", "$" + ce.expression.getText(),
    ...ce.arguments.map(arg => parseExpression(ctx, arg))
  );
}

function handleSpecialFunctions(ctx: Context, name: string, ce: CallExpression): Sexpr | null {
  const type = ctx.typeChecker.getTypeAtLocation(ce.expression);

  if (ce.expression.kind === SyntaxKind.PropertyAccessExpression) {
    // If we have Foo.Bar

    const castedExpr    = ce.expression as PropertyAccessExpression;
    const fooDotBar     = castedExpr.expression;
    const justBar       = castedExpr.name;
    const fooDotBarType = ctx.typeChecker.getTypeAtLocation(fooDotBar);

    if (fooDotBarType.flags & TypeFlags.StringLike) {
      if (justBar.getText() === "charCodeAt") {
        return S("i32", "call", "$__charCodeAt", parseExpression(ctx, fooDotBar), parseExpression(ctx, ce.arguments[0]));
      }

      if (justBar.getText() === "charAt") {
        return S("i32", "call", "$__charAt", parseExpression(ctx, fooDotBar), parseExpression(ctx, ce.arguments[0]));
      }
    }
  }

  if (ce.expression.getText() === "mset") {
    const res = S.Store(
      parseExpression(ctx, ce.arguments[0]),
      parseExpression(ctx, ce.arguments[1]),
    );

    return res;
  } else if (ce.expression.getText() === "mget") {
    return S.Load(
      "i32",
      parseExpression(ctx, ce.arguments[0]),
    );
  } else if (ce.expression.getText() === "divfloor") {
    return S(
      "i32",
      "i32.trunc_s/f32",
      S("f32", 
        "f32.floor",
          S(
            "f32",
            "f32.div",
            S("f32", "f32.convert_s/i32", parseExpression(ctx, ce.arguments[0])),
            S("f32", "f32.convert_s/i32", parseExpression(ctx, ce.arguments[1])),
          )
      )
    );
  } else if (ce.expression.getText() === "clog") {
    const logArgs: {
      size: Sexpr;
      start: Sexpr;
      type: number;
      putValueInMemory: Sexpr[];
    }[] = [];

    let offset = 10000;

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
      } else if (arg.kind === SyntaxKind.Identifier) {
        const type = ctx.typeChecker.getTypeAtLocation(arg);

        if (type.flags & TypeFlags.String || type.flags & TypeFlags.StringLiteral) {
          logArgs.push({
            size: S.Load("i32", ctx.getVariable(arg.getText())),
            start: ctx.getVariable(arg.getText()),
            type: 2,
            putValueInMemory: [
              S.Store(
                S.Const("i32", offset),
                ctx.getVariable(arg.getText())
              )
            ],
          });
        } else if (type.flags & TypeFlags.NumberLike) {
          logArgs.push({
            size: S.Const("i32", 4),
            start: S.Const("i32", offset),
            type: 1,
            putValueInMemory: [
              S.Store(
                S.Const("i32", offset),
                ctx.getVariable(arg.getText())
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
    return null;
  }
}