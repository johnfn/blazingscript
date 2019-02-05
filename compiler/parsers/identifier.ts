import { Identifier } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

/**
 * e.g. const foo = 5
 *            ^^^
 */
export class BSIdentifier extends BSNode {
  children: BSNode[] = [];
  text    : string;
  isLhs   : boolean;

  constructor(ctx: Scope, node: Identifier, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.text  = node.text;
    this.isLhs = info.isLhs;
  }

  compile(ctx: Scope): Sexpr {
    const asVariable = ctx.variables.getOrNull(this.text);

    if (asVariable) {
      return asVariable;
    }

    const fn = ctx.functions.getFunctionByName(this.text);

    if (fn) {
      return S.Const(fn.tableIndex);
    }

    console.log(this.fullText);
    console.log(ctx.toString());

    throw new Error("Unhandled node type");
  }
}
