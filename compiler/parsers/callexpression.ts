import { Context } from "../context";
import { CallExpression, SyntaxKind, TypeFlags, PropertyAccessExpression } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { flatten, BSNode, BSExpression } from "../rewriter";
import { parseExpression } from "./expression";

export class BSCallExpression extends BSNode {
  children  : BSNode[];
  
  expression: BSExpression;
  arguments : BSExpression[];

  constructor(node: CallExpression) {
    super();

    this.expression = new BSExpression(node.expression);
    this.arguments = [...node.arguments].map(arg => new BSExpression(arg));

    this.children = [this.expression, ...this.arguments];
  }
}

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
  if (ce.expression.kind === SyntaxKind.PropertyAccessExpression) {
    // If we have Foo.Bar

    const castedExpr    = ce.expression as PropertyAccessExpression;
    const fooDotBar     = castedExpr.expression;
    const justBar       = castedExpr.name;
    const fooDotBarType = ctx.typeChecker.getTypeAtLocation(fooDotBar);

    if (
      (fooDotBarType.flags & TypeFlags.StringLike) || 
      (fooDotBarType.symbol.name === ctx.getNativeTypeName("String")) // for this types
    ) {
      return ctx.callMethod({
        className: ctx.getNativeTypeName("String"),
        methodName: justBar.getText(),
        thisExpr  : fooDotBar,
        argExprs  : [...ce.arguments],
      })
    }
  }

  if (ce.expression.getText() === "memwrite") {
    const res = S.Store(
      parseExpression(ctx, ce.arguments[0]),
      parseExpression(ctx, ce.arguments[1]),
    );

    return res;
  } else if (ce.expression.getText() === "memread") {
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
  } else if (ce.expression.getText() === "log") {
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
          throw new Error(`dont know how to log that!! ${TypeFlags[type.flags]}... ${type.flags & TypeFlags.String} in ${arg.getText()}`);
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

    return S.Block([
        // store all args into memory

        ...flatten(logArgs.map(obj => obj.putValueInMemory)),

        S(
          "[]",
          "call",
          "$log",
          ...flatten(
            logArgs.map(obj => [
              S.Const("i32", obj.type),
              obj.start,
              S("i32", "i32.add", obj.start, obj.size),
            ])
          ),
        )
      ]
    );
  } else {
    return null;
  }
}