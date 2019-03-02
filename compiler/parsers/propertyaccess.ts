import { PropertyAccessExpression, TypeFlags, SymbolFlags } from "typescript";
import { Sexpr, S, sexprToString } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { BSIdentifier } from "./identifier";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";
import { BSObjectLiteralExpression } from "./objectliteralexpression";

/**
 * e.g. const x = foo.bar
 *                ^^^^^^^
 */
export class BSPropertyAccessExpression extends BSNode {
  children  : BSNode[];

  /**
   * e.g. "foo" in the example
   */
  expression: BSExpression;

  /**
   * e.g. "bar" in the example
   */
  name      : BSIdentifier;
  isLhs     : boolean;
  node      : PropertyAccessExpression;

  constructor(scope: Scope, node: PropertyAccessExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.isLhs = info.isLhs || false;

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression),
      this.name       = buildNode(scope, node.name),
    );

    this.node = node;
  }

  compile(scope: Scope): CompileResultExpr {
    let expr: Sexpr | null = null;
    const compiledExpr = this.expression.compile(scope);

    if (this.expression.tsType.symbol && this.expression.tsType.symbol.flags & SymbolFlags.ObjectLiteral) {
      // Handle object literal properties.

      const objectType = BSObjectLiteralExpression.FindObjectTypeBySymbol(this.expression.tsType.symbol);
      const prop = objectType.propertyOffsets.find(({ name }) => name === this.name.text);

      if (!prop) { throw new Error("Offset not found for property in object literal!") }

      expr = S.Add(
        compiledExpr.expr,
        prop.offset
      );
    } else {
      // Handle class properties and functions.

      if (this.tsType.symbol && this.tsType.symbol.flags & SymbolFlags.Method) {
        const fn = scope.functions.getByType(this.tsType)

        if (fn) {
          let typeParam = "";

          if (fn.typeParamSig.length > 0) {
            if (fn.typeParamSig.length > 1) {
              throw new Error("Dont handle type param signatures > 1 length yet!");
            }

            typeParam = scope.typeParams.get(fn.typeParamSig[0]).substitutedType;
          }

          expr = S.Const(fn.getTableIndex(typeParam));
        } else {
          throw new Error("I know it's a method, but i cant find it")
        }
      } else {
        // TODO: better check to ensure that we actually have a property than "it's not a method"?

        const prop = scope.properties.getByNode(this.node);

        if (prop) {
          expr = S.Add(
            compiledExpr.expr,
            prop.offset
          );
        }
      }

      if (!expr) {
        throw new Error("Couldnt find neither prop nor fn for property access.");
      }
    }

    if (!this.isLhs) {
      expr = S.Load("i32", expr);
    }

    return {
      expr,
      functions: [
        ...compiledExpr.functions,
      ],
    };
  }
}