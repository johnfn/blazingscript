import { NumericLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";

/**
 * e.g. const x = 20;
 *                ^^
 */
export class BSNumericLiteral extends BSNode {
  children: BSNode[] = [];
  value   : number;

  constructor(scope: Scope, node: NumericLiteral, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.value = Number(node.text);
  }

  compile(scope: Scope): CompileResultExpr {
    return {
      expr     : S.Const(this.value),
      functions: [],
    };
  }
}
