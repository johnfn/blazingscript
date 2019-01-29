import {
  FunctionDeclaration,
} from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context } from "../context";
import { parseStatementList, parseStatementListBS } from "./statementlist";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSNode } from "./bsnode";

/**
 * e.g. const x = function () { } 
 *                ^^^^^^^^^^^^^^^
 */
export class BSFunctionExpression extends BSNode {
  children = [];

  constructor(ctx: Context, node: FunctionDeclaration) {
    super(ctx, node);
  }

  compile(ctx: Context): Sexpr {
    throw new Error("unhandled node: function expression")
  }
}
