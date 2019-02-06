import { Block, isSwitchStatement, ImportDeclaration, SyntaxKind, StringLiteral } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "./statementlist";
import { Scope } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { flatArray } from "../util";
import { buildNode, buildNodeArray } from "./nodeutil";
import { BSStringLiteral } from "./stringliteral";

/**
 * e.g. import { foo } from './bar'
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSImportDeclaration extends BSNode {
  children  : BSNode[];
  moduleName: BSStringLiteral;

  constructor(ctx: Scope, node: ImportDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    if (!(node.moduleSpecifier.kind === SyntaxKind.StringLiteral)) {
      throw new Error(`Trying to import from ${ node.moduleSpecifier.getText() } which is not a string.`)
    }

    this.children = flatArray(
      this.moduleName = buildNode(ctx, node.moduleSpecifier as StringLiteral)
    );
  }

  compile(ctx: Scope): Sexpr {
    return S.Block(parseStatementListBS(ctx, this.children));
  }
}
