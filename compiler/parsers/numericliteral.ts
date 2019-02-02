import { NumericLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

/**
 * e.g. const x = 20;
 *                ^^
 */
export class BSNumericLiteral extends BSNode {
  children: BSNode[] = [];
  value   : number;

  constructor(ctx: Scope, node: NumericLiteral, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    // TODO: Won't handle weird literals?

    this.value = Number(node.text);
  }

  compile(ctx: Scope): Sexpr {
    return S.Const(this.value);
  }
}
