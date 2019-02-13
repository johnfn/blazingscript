import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { PropertyAssignment } from "typescript";
import { buildNodeArray, buildNode } from "./nodeutil";
import { BSPropertyName, BSExpression } from "./expression";

/**
 * e.g.
 * 
 * const obj = { x: 1, y: 2 }
 *               ^^^^^
 */
export class BSPropertyAssignment extends BSNode {
  children   : BSNode[];
  name       : BSPropertyName
  initializer: BSExpression;

  constructor(scope: Scope, node: PropertyAssignment, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = [
      this.name        = buildNode(scope, node.name),
      this.initializer = buildNode(scope, node.initializer),
    ];
  }

  compile(scope: Scope): Sexpr {
    return this.initializer.compile(scope);
  }
}
