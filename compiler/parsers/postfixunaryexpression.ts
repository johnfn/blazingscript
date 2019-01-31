import { PostfixUnaryExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../scope/context";
import { BSNode } from "./bsnode";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. console.log(x++)
 *                  ^^^
 */
export class BSPostfixUnaryExpression extends BSNode {
  children   : BSNode[];
  expression : BSNode;
  operandName: string;

  constructor(ctx: Context, node: PostfixUnaryExpression) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.operand),
    );

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

    return S.SetLocal(this.operandName, S.Add(exprCompiled, 1));
  }
}
