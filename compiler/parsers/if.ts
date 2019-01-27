import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { parseStatement, BSStatement } from "./statement";
import { parseExpression, BSExpression } from "./expression";
import { BSNode } from "../rewriter";

export class BSIfStatement extends BSNode {
  children: BSNode[];

  condition: BSExpression;
  ifTrue   : BSStatement;
  ifFalse  : BSStatement | null;

  constructor(node: IfStatement) {
    super();

    this.condition = new BSExpression(node.expression);
    this.ifTrue    = new BSStatement(node.thenStatement);
    this.ifFalse   = node.elseStatement ? new BSStatement(node.elseStatement) : null;

    this.children = [
      this.condition,
      this.ifTrue,
      ...(this.ifFalse ? [this.ifFalse] : []),
    ];
  }
}

export function parseIfStatement(ctx: Context, node: IfStatement): Sexpr {
  let thn = parseStatement(ctx, node.thenStatement) || S.Const("i32", 0);
  let els = node.elseStatement ? parseStatement(ctx, node.elseStatement) : undefined;

  if (thn.type !== "[]") {
    thn = S.Drop(thn);
  }

  if (els && els.type !== "[]") {
    els = S.Drop(els);
  }

  const result = S(
    "[]",
    "if",
    parseExpression(ctx, node.expression),
    S("[]", "then", thn),
    S("[]", "else", els ? els : S("[]", "nop"))
  );

  return result;
}
