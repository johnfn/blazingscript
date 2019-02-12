import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr, S, sexprToString } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { BSIdentifier } from "./identifier";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

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

    this.children = flatArray(
      this.expression = buildNode(scope, node.expression),
      this.name       = buildNode(scope, node.name),
    );
  }

  compile(scope: Scope): Sexpr {
    const prop = scope.properties.get({ 
      expr      : this.expression, 
      exprScope: scope, 
      name      : this.name.text,
    });

    if (this.isLhs) {
      return prop;
    } else {
      return S.Load("i32", prop);
    }
  }
}