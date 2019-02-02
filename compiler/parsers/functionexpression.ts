import {
  FunctionDeclaration,
} from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

/**
 * e.g. const x = function () { }
 *                ^^^^^^^^^^^^^^^
 */
export class BSFunctionExpression extends BSNode {
  children = [];

  constructor(ctx: Scope, node: FunctionDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);
  }

  compile(ctx: Scope): Sexpr {
    throw new Error("unhandled node: function expression")
  }
}
