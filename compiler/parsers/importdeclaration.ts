import { Block, isSwitchStatement, ImportDeclaration, SyntaxKind, StringLiteral, ImportClause } from "typescript";
import { Sexpr, S } from "../sexpr";
import { compileStatementList } from "./statementlist";
import { Scope } from "../scope/scope";
import { BSNode, defaultNodeInfo, NodeInfo, CompileResultExpr } from "./bsnode";
import { flattenArray } from "../util";
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

  constructor(scope: Scope, node: ImportDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    if (!(node.moduleSpecifier.kind === SyntaxKind.StringLiteral)) {
      throw new Error(`Trying to import from ${ node.moduleSpecifier.getText() } which is not a string.`)
    }

    const moduleName = buildNode(scope, node.moduleSpecifier as StringLiteral);

    this.children = flattenArray(
      this.moduleName = moduleName,
      this.importClause = buildNode(scope, node.importClause, { moduleName: moduleName.text })
    );

    scope.modules.add(this.moduleName.text + ".ts");
  }

  compile(scope: Scope): CompileResultExpr {
    const compiledList = compileStatementList(scope, this.children);

    return {
      expr     : S.Block(compiledList.statements),
      functions: compiledList.functions,
    };
  }
}
