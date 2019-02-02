import { PostfixUnaryExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
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

  constructor(ctx: Scope, node: PostfixUnaryExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.expression = buildNode(ctx, node.operand),
    );

    this.operandName = node.operand.getText();
  }

  compile(ctx: Scope): Sexpr {
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
