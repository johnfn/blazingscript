import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSStatement } from "./statement";
import { BSNode } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. if (foo) { bar() } else { baz() }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSIfStatement extends BSNode {
  children  : BSNode[];

  condition : BSExpression;
  ifTrue    : BSStatement | null;
  ifFalse   : BSStatement | null;

  constructor(ctx: Context, node: IfStatement) {
    super(ctx, node);

    this.children = flatArray(
      this.condition = buildNode(ctx, node.expression),
      this.ifTrue    = buildNode(ctx, node.thenStatement),
      this.ifFalse   = buildNode(ctx, node.elseStatement),
    );
  }

  compile(ctx: Context): Sexpr {
    let thn = (this.ifTrue && this.ifTrue.compile(ctx)) || S.Const(0);
    let els = (this.ifFalse && this.ifFalse.compile(ctx)) || S.Const(0);

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