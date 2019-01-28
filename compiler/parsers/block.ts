import { Block } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementList, parseStatementListBS } from "./statementlist";
import { Context } from "../context";
import { BSStatement } from "./statement";
import { BSNode } from "./bsnode";

export class BSBlock extends BSNode {
  children: BSNode[];

  constructor(ctx: Context, node: Block) {
    super(ctx, node);

    this.children = node.statements.map(
      statement => new BSStatement(ctx, statement)
    );
  }

  compile(ctx: Context): Sexpr {
    return S.Block(parseStatementListBS(ctx, this.children));
  }
}
