import { ReturnStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseExpression, BSExpression } from "./expression";
import { Context } from "../context";
import { BSNode } from "../rewriter";

export class BSReturnStatement extends BSNode {
  children: BSNode[];
  expression: BSExpression | null;

  constructor(node: ReturnStatement) {
    super();

    this.expression = node.expression ? new BSExpression(node.expression) : null;
    this.children = this.expression ? [this.expression] : [];
  }
}

export function parseReturnStatement(ctx: Context, rs: ReturnStatement): Sexpr {
  if (rs.expression) {
    return S("[]", "return",
      parseExpression(ctx, rs.expression),
    );
  } else {
    return S("[]", "return");
  }
}
