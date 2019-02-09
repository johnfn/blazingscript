import { ReturnStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

export class BSReturnStatement extends BSNode {
  children  : BSNode[];
  expression: BSNode | null;

  constructor(ctx: Scope, node: ReturnStatement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Scope): Sexpr {
    if (this.expression) {
      const exprCompiled = this.expression.compile(ctx);

      if (exprCompiled) {
        return S("[]", "return", S.Block(exprCompiled));
      }
    }

    return S("[]", "return");
  }
}
