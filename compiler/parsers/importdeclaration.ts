import { Block, isSwitchStatement, ImportDeclaration, SyntaxKind, StringLiteral, ImportClause } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "./statementlist";
import { Scope } from "../scope/scope";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { flatArray } from "../util";
import { buildNode } from "./nodeutil";
import { BSStringLiteral } from "./stringliteral";
import { BSImportClause } from "./importclause";

/**
 * e.g. import { foo } from './bar'
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSImportDeclaration extends BSNode {
  children    : BSNode[];
  moduleName  : BSStringLiteral;
  importClause: BSImportClause | null;

  constructor(ctx: Scope, node: ImportDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    if (!(node.moduleSpecifier.kind === SyntaxKind.StringLiteral)) {
      throw new Error(`Trying to import from ${ node.moduleSpecifier.getText() } which is not a string.`)
    }

    const moduleName = buildNode(ctx, node.moduleSpecifier as StringLiteral);

    this.children = flatArray(
      this.moduleName = moduleName,
      this.importClause = buildNode(ctx, node.importClause, { moduleName: moduleName.text })
    );

    ctx.modules.add(this.moduleName.text + ".ts");
  }

  compile(ctx: Scope): Sexpr {
    return S.Block(parseStatementListBS(ctx, this.children));
  }
}
