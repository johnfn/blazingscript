import { PropertyAccessExpression, TypeFlags, SymbolFlags } from "typescript";
import { Sexpr, S, sexprToString } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
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

  constructor(scope: Scope, node: PropertyAccessExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.isLhs = info.isLhs || false;

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression),
      this.name       = buildNode(scope, node.name),
    );
  }

  compile(scope: Scope): Sexpr {
    let expr: Sexpr;

    if (this.expression.tsType.symbol && this.expression.tsType.symbol.flags & SymbolFlags.ObjectLiteral) {
      // Handle object literal properties.

      const objectType = BSObjectLiteralExpression.FindObjectTypeBySymbol(this.expression.tsType.symbol);
      const prop = objectType.propertyOffsets.find(({ name }) => name === this.name.text);

      if (!prop) { throw new Error("Offset not found for property in object literal!") }

      expr = S.Add(
        this.expression.compile(scope),
        prop.offset
      );
    } else {
      // Handle class properties and functions.

      expr = scope.properties.get({ 
        expr      : this.expression, 
        exprScope: scope, 
        name      : this.name.text,
      });
    }

    if (this.isLhs) {
      return expr;
    } else {
      return S.Load("i32", expr);
    }
  }
}