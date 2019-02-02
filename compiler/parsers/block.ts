import { Block, isSwitchStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "./statementlist";
import { Scope } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { flatArray } from "../util";
import { buildNode, buildNodeArray } from "./nodeutil";

/**
 * e.g. if (x) { console.log("Hello") }
 *             ^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSBlock extends BSNode {
  children : BSNode[];
  statement: BSStatement[] | null;

  constructor(ctx: Scope, node: Block, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.statement = buildNodeArray(ctx, node.statements),
    );
  }

  compile(ctx: Scope): Sexpr {
    return S.Block(parseStatementListBS(ctx, this.children));
  }
}
