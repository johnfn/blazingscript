import { PostfixUnaryExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { getExpressionNode } from "./expression";

export class BSPostfixUnaryExpression extends BSNode {
  children: BSNode[];
  expression: BSNode;

  operandName: string;

  constructor(ctx: Context, node: PostfixUnaryExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.operand);
    this.children = [this.expression];

    this.operandName = node.operand.getText();
  }

  compile(ctx: Context): Sexpr {
    // TODO: Check types! (mostly vs f32 etc)
    // TODO: Return previous value.
    // TODO: consider ++ vs --
    // TODO: Should use context to set local, it's safer

    const exprCompiled = this.expression.compile(ctx);

    if (!exprCompiled) {
      throw new Error("lhs didnt compile???");
    }

    return S.SetLocal(
      this.operandName,
      S("i32", "i32.add", exprCompiled, S.Const("i32", 1))
    );
  }
}
