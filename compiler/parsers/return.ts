import { ReturnStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr, isCompileResultExpr } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";
import { BSExpression } from "./expression";

export class BSReturnStatement extends BSNode {
  children  : BSNode[];
  expression: BSExpression | null;

  constructor(scope: Scope, node: ReturnStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    if (this.expression) {
      const exprCompiled = this.expression.compile(scope);

      return {
        expr     : S("[]", "return", exprCompiled.expr),
        functions: exprCompiled.functions,
      };
    }

    return {
      expr     : S("[]", "return"),
      functions: [],
    };
  }
}
