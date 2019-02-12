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

  constructor(scope: Scope, node: Identifier, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.text  = node.text;
    this.isLhs = info.isLhs || false;
  }

  compile(scope: Scope): Sexpr {
    const asVariable = scope.variables.getOrNull(this.text);

    if (asVariable) {
      return asVariable;
    }

    const fn = scope.functions.getFunctionByName(this.text);

    if (fn) {
      return S.Const(fn.tableIndex);
    }

    console.log(this.text);
    // console.log(scope.topmostScope().toString());

    throw new Error("Unhandled node type");
  }
}
