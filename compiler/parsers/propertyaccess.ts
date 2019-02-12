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

  constructor(ctx: Scope, node: PropertyAccessExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.isLhs = info.isLhs || false;

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
      this.name       = buildNode(ctx, node.name),
    );
  }

  compile(ctx: Scope): Sexpr {
    const prop = ctx.properties.get({ 
      expr   : this.expression, 
      exprCtx: ctx, 
      name   : this.name.text,
    });

    if (this.isLhs) {
      return prop;
    } else {
      return S.Load("i32", prop);
    }
  }
}