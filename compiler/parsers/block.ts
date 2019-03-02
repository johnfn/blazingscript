import { Block, isSwitchStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { compileStatementList } from "./statementlist";
import { Scope } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo, CompileResultExpr, CompileResultStatements } from "./bsnode";
import { flattenArray } from "../util";
import { buildNode, buildNodeArray } from "./nodeutil";

/**
 * e.g. if (x) { foo("Hello"); bar("world") }
 *             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSBlock extends BSNode {
  children : BSNode[];
  statement: BSStatement[] | null;

  constructor(scope: Scope, node: Block, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.statement = buildNodeArray(scope, node.statements),
    );
  }

  compile(scope: Scope): CompileResultStatements {
    return compileStatementList(scope, this.children);
  }
}
