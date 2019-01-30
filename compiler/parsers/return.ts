import { ReturnStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { getExpressionNode } from "./expression";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

export class BSReturnStatement extends BSNode {
  children  : BSNode[];
  expression: BSNode | null;

  constructor(ctx: Context, node: ReturnStatement) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.expression),
    );
  }

  compile(ctx: Context): Sexpr {
    if (this.expression) {
      const exprCompiled = this.expression.compile(ctx);

      if (exprCompiled) {
        return S("[]", "return", exprCompiled);
      }
    }

    return S("[]", "return");
  }
}
