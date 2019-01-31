import { Block, isSwitchStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "./statementlist";
import { Context } from "../scope/context";
import { BSStatement } from "./statement";
import { BSNode } from "./bsnode";
import { flatArray } from "../util";
import { buildNode, buildNodeArray } from "./nodeutil";

/**
 * e.g. if (x) { console.log("Hello") }
 *             ^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSBlock extends BSNode {
  children : BSNode[];
  statement: BSStatement[] | null;

  constructor(ctx: Context, node: Block) {
    super(ctx, node);

    this.children = flatArray(
      this.statement = buildNodeArray(ctx, node.statements),
    );
  }

  compile(ctx: Context): Sexpr {
    return S.Block(parseStatementListBS(ctx, this.children));
  }
}
