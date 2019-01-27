import { Block } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementList } from "./statementlist";
import { Context } from "../context";
import { BSNode } from "../rewriter";
import { BSStatement } from "./statement";

export class BSBlock extends BSNode {
  children: BSNode[];

  constructor(node: Block) {
    super();

    this.children = node.statements.map(statement => new BSStatement(statement));
  }
}

export function parseBlock(ctx: Context, block: Block): Sexpr {
  return S.Block(parseStatementList(ctx, block.statements));
}
