import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";

/**
 * e.g. if (foo) { bar() } else { baz() }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSIfStatement extends BSNode {
  children  : BSNode[];

  condition : BSExpression;
  ifTrue    : BSStatement | null;
  ifFalse   : BSStatement | null;

  constructor(scope: Scope, node: IfStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.condition = buildNode(scope, node.expression),
      this.ifTrue    = buildNode(scope, node.thenStatement),
      this.ifFalse   = buildNode(scope, node.elseStatement),
    );
  }

  compile(scope: Scope): Sexpr {
    let thn = (this.ifTrue && this.ifTrue.compile(scope)) || S.Const(0);
    let els = (this.ifFalse && this.ifFalse.compile(scope)) || S.Const(0);

    if (thn.type !== "[]") {
      thn = S.Drop(thn);
    }

    if (els && els.type !== "[]") {
      els = S.Drop(els);
    }

    const result = S(
      "[]",
      "if",
      this.condition.compile(scope),
      S("[]", "then", thn),
      S("[]", "else", els ? els : S("[]", "nop"))
    );

    return result;
  }
}