import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSStatement, parseStatement } from "./statement";
import { BSNode } from "./bsnode";
import { getExpressionNode, BSExpressionNode } from "./expression";

export class BSIfStatement extends BSNode {
  children  : BSNode[];

  nodeREMOVE: IfStatement;
  condition : BSExpressionNode;
  ifTrue    : BSStatement;
  ifFalse   : BSStatement | null;

  constructor(ctx: Context, node: IfStatement) {
    super(ctx, node);

    this.condition = getExpressionNode(ctx, node.expression);
    this.ifTrue = new BSStatement(ctx, node.thenStatement);
    this.ifFalse = node.elseStatement
      ? new BSStatement(ctx, node.elseStatement)
      : null;

    this.children = [
      this.condition,
      this.ifTrue,
      ...(this.ifFalse ? [this.ifFalse] : [])
    ];

    this.nodeREMOVE = node;
  }

  compile(ctx: Context): Sexpr {
    let thn = this.ifTrue.compile(ctx) || S.Const("i32", 0);
    let els = this.ifFalse ? this.ifFalse.compile(ctx) : undefined;

    if (thn.type !== "[]") {
      thn = S.Drop(thn);
    }

    if (els && els.type !== "[]") {
      els = S.Drop(els);
    }

    const result = S(
      "[]",
      "if",
      this.condition.compile(ctx),
      S("[]", "then", thn),
      S("[]", "else", els ? els : S("[]", "nop"))
    );

    return result;
  }
}