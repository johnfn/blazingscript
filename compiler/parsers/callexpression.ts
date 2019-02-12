import { Scope } from "../scope/scope";
import { CallExpression, TypeFlags } from "typescript";
import { Sexpr, S, Sx, sexprToString } from "../sexpr";
import { flatten } from "../rewriter";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { parseStatementListBS } from "./statementlist";
import { BSIdentifier } from "./identifier";
import { BSPropertyAccessExpression } from "./propertyaccess";
import { BSStringLiteral } from "./stringliteral";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";
import { BSArrayLiteral, isArrayType } from "./arrayliteral";
import { TsTypeToWasmType, Functions } from "../scope/functions";

/**
 * e.g. const x = myFunction(1, 5);
 *                ^^^^^^^^^^^^^^^^
 */
export class BSCallExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;
  arguments : BSExpression[];

  constructor(scope: Scope, node: CallExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flatArray(
      this.expression = buildNode(scope, node.expression, { isLhs: true }),
      this.arguments  = buildNodeArray(scope, node.arguments),
    );
  }

  compile(scope: Scope): Sexpr {
    const special = this.handleSpecialFunctions(scope);

    if (special !== null) {
      return special;
    }

    const sig = Functions.GetCallExpressionSignature(this);

    if (this.expression instanceof BSPropertyAccessExpression) {
      // pass in "this" argument

      const res = S(
        "i32",
        "call_indirect",
        S("[]", "type", sig.name),
        this.expression.expression.compile(scope),
        ...parseStatementListBS(scope, this.arguments),
        this.expression.compile(scope),
        `;; ${ this.fullText.replace(/\n/g, "") } (with this)\n`
      );

      return res;
    } else {
      return S(
        "i32",
        "call_indirect",
        S("[]", "type", sig.name),
        ...parseStatementListBS(scope, this.arguments),
        this.expression.compile(scope),
        `;; ${ this.expression.fullText.replace(/\n/g, "") }\n`
      );
    }
  }

  handleSpecialFunctions(scope: Scope): Sexpr | null {
    if (this.expression instanceof BSIdentifier) {
      if (this.expression.text === "memwrite") {
        const res = S.Store(
          this.arguments[0].compile(scope)!,
          this.arguments[1].compile(scope)!
        );

        return res;
      } else if (this.expression.text === "memread") {
        return S.Load("i32", this.arguments[0].compile(scope)!);
      } else if (this.expression.text === "elemSize") {
        return S.Const(BSArrayLiteral.GetArrayElemSize(scope, this.arguments[0].tsType));
      } else if (this.expression.text === "divfloor") {
        return S(
          "i32",
          "i32.trunc_s/f32",
          S(
            "f32",
            "f32.floor",
            S(
              "f32",
              "f32.div",
              S("f32", "f32.convert_s/i32", this.arguments[0].compile(scope)!),
              S("f32", "f32.convert_s/i32", this.arguments[0].compile(scope)!)
            )
          )
        );
      } else if (this.expression.text === "log") {
        console.log(this.expression.line, this.expression.char);

        const logArgs: {
          size: Sexpr;
          start: Sexpr;
          type: number;
          putValueInMemory: Sexpr[];
        }[] = [];

        let offset = 50000;

        for (const arg of this.arguments) {
          if (arg instanceof BSStringLiteral) {
            const str = arg.text;

            logArgs.push({
              size: S.Const(str.length),
              start: S.Const(offset),
              type: 0,
              putValueInMemory: Sx.SetStringLiteralAt(offset, str)
            });

            offset += str.length;
          } else if (arg instanceof BSIdentifier) {
            if (arg.tsType.flags & TypeFlags.StringLike) {
              logArgs.push({
                size: S.Load("i32", scope.variables.get(arg.text)),
                start: scope.variables.get(arg.text),
                type: 2,
                putValueInMemory: [
                  S.Store(S.Const(offset), scope.variables.get(arg.text))
                ]
              });
            } else if (arg.tsType.flags & TypeFlags.NumberLike) {
              logArgs.push({
                size: S.Const(4),
                start: S.Const(offset),
                type: 1,
                putValueInMemory: [
                  S.Store(S.Const(offset), scope.variables.get(arg.text))
                ]
              });
            } else {
              throw new Error(
                `dont know how to log that!! ${ TypeFlags[arg.tsType.flags] }... ${arg.tsType.flags & TypeFlags.String} in ${arg.text}`
              );
            }

            offset += 4;
          } else {
            const result = arg.compile(scope);

            if (!result) {
              throw new Error("Cant compile that!");
            }

            logArgs.push({
              size: S.Const(4),
              start: S.Const(offset),
              type: 1,
              putValueInMemory: [S.Store(S.Const(offset), result)]
            });

            offset += 4;
          }
        }

        while (logArgs.length < 3) {
          logArgs.push({
            size: S.Const(0),
            start: S.Const(0),
            type: 9999,
            putValueInMemory: [S("[]", "nop")]
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
                S.Const(obj.type),
                obj.start,
                S.Add(obj.start, obj.size),
              ])
            ),
            S.Const(this.expression.line),
            S.Const(this.expression.char),
            S.Const(0),
          )
        ]);
      }
    }

    return null;
  }
}
