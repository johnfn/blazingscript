import { ReturnStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

export class BSReturnStatement extends BSNode {
  children  : BSNode[];
  expression: BSNode | null;

  constructor(scope: Scope, node: ReturnStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flatArray(
      this.expression = buildNode(scope, node.expression),
    );
  }

  compile(scope: Scope): Sexpr {
    if (this.expression) {
      const exprCompiled = this.expression.compile(scope);

      if (exprCompiled) {
        return S("[]", "return", S.Block(exprCompiled));
      }
    }

    return S("[]", "return");
  }
}
