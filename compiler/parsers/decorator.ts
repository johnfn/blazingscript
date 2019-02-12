import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { Decorator } from "typescript";
import { BSExpression } from "./expression";
import { flatArray } from "../util";
import { buildNode } from "./nodeutil";

/**
 * e.g. class MyClass { @foo myFunction() { } }
 *                      ^^^^
 *
 * (Note the JS limitation that decorators can not be added to top-level
 * functions.)
 */
export class BSDecorator extends BSNode {
  children  : BSNode[];
  expression: BSExpression;

  constructor(scope: Scope, node: Decorator, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flatArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): Sexpr {
    throw new Error("Cant compile decorators! They are only currently for metadata.");
  }
}
