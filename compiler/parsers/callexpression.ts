import { Scope } from "../scope/scope";
import { CallExpression, TypeFlags, SignatureKind, TypeParameterDeclaration, SymbolFlags } from "typescript";
import { Sexpr, S, Sx, sexprToString } from "../sexpr";
import { flatten } from "../rewriter";
import { BSNode, defaultNodeInfo, NodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { compileStatementList } from "./statementlist";
import { BSIdentifier } from "./identifier";
import { BSPropertyAccessExpression } from "./propertyaccess";
import { BSStringLiteral } from "./stringliteral";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flattenArray } from "../util";
import { BSArrayLiteral } from "./arrayliteral";
import { Functions } from "../scope/functions";

/**
 * e.g. const x = myFunction(1, 5);
 *                ^^^^^^^^^^^^^^^^
 */
export class BSCallExpression extends BSNode {
  children  : BSNode[];
  expression: BSExpression;
  arguments : BSExpression[];
  node      : CallExpression;

  constructor(scope: Scope, node: CallExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.node = node;

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression, { isLhs: true }),
      this.arguments  = buildNodeArray(scope, node.arguments),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    const special = this.handleNativeFunctions(scope);

    if (special !== null) {
      return special;
    }

    const declaredParameterTypes = scope.typeChecker
      .getSignaturesOfType(this.expression.tsType, SignatureKind.Call)[0]!
      .parameters
      .map(param => 
        scope.typeChecker.getTypeOfSymbolAtLocation(param, this.node)
    );

    for (let i = 0; i < declaredParameterTypes.length; i++) {
      const declaredType = declaredParameterTypes[i];
      const actualType   = this.arguments[i].tsType;

      if (declaredType.flags & TypeFlags.TypeParameter) {
        let typeName: string;

        if (actualType.flags & TypeFlags.StringLike) {
          typeName = "string";
        } else if (actualType.flags & TypeFlags.NumberLike) {
          typeName = "number";
        } else {
          throw new Error("unhandled type for generic function");
        }

        scope.typeParams.add({ 
          name           : declaredType.symbol.name,
          substitutedType: typeName,
        });
      }
    }

    const sig = Functions.GetCallExpressionSignature(this);

    if (this.expression instanceof BSPropertyAccessExpression) {
      // pass in "this" argument

      const thisCompiled = this.expression.expression.compile(scope);
      const bodyCompiled = this.expression.compile(scope);
      const argsCompiled = compileStatementList(scope, this.arguments);

      const res = S(
        "i32",
        "call_indirect",
        S("[]", "type", sig.name),
        thisCompiled.expr,
        ...argsCompiled.statements,
        bodyCompiled.expr,
        `;; ${ this.fullText.replace(/\n/g, "") } (with this)\n`
      );

      return {
        expr: res,
        functions: [...thisCompiled.functions, ...bodyCompiled.functions, ...argsCompiled.functions],
      };
    } else {
      const bodyCompiled = this.expression.compile(scope);
      const argsCompiled = compileStatementList(scope, this.arguments);

      const res = S(
        "i32",
        "call_indirect",
        S("[]", "type", sig.name),
        ...argsCompiled.statements,
        bodyCompiled.expr,
        `;; ${ this.expression.fullText.replace(/\n/g, "") }\n`
      );

      return {
        expr: res,
        functions: [...bodyCompiled.functions, ...argsCompiled.functions],
      };
    }
  }

  handleNativeFunctions(scope: Scope): CompileResultExpr | null {
    if (this.expression instanceof BSIdentifier) {
      if (this.expression.text === "memwrite") {
        const arg0 = this.arguments[0].compile(scope);
        const arg1 = this.arguments[1].compile(scope);

        return { 
          expr: S.Store(arg0.expr, arg1.expr),
          functions: [...arg0.functions, ...arg1.functions],
        }
      } else if (this.expression.text === "memread") {
        const arg0 = this.arguments[0].compile(scope);

        return { 
          expr: S.Load("i32", arg0.expr),
          functions: arg0.functions,
        }
      } else if (this.expression.text === "elemSize") {
        return {
          expr: S.Const(BSArrayLiteral.GetArrayElemSize(scope, this.arguments[0].tsType)),
          functions: [],
        };
      } else if (this.expression.text === "divfloor") {
        const arg0 = this.arguments[0].compile(scope);

        return {
          expr: S(
            "i32",
            "i32.trunc_s/f32",
            S(
              "f32",
              "f32.floor",
              S(
                "f32",
                "f32.div",
                S("f32", "f32.convert_s/i32", arg0.expr),
                S("f32", "f32.convert_s/i32", arg0.expr)
              )
            )
          ),
          functions: [],
        };
      } else if (this.expression.text === "log") {
        const logArgs: {
          size: Sexpr;
          start: Sexpr;
          type: number;
          putValueInMemory: Sexpr[];
        }[] = [];
        let functions: Sexpr[] = [];

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
              putValueInMemory: [S.Store(S.Const(offset), result.expr)]
            });

            functions = [...functions, ...result.functions];

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

        return {
          expr: S.Block([
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
            ]),
          functions: functions,
        }
      }
    }

    return null;
  }
}
