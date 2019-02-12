import { SourceFile } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { flatArray, assertNever, normalizeString as normalizeModuleName } from "../util";
import { buildNodeArray } from "./nodeutil";

export class BSSourceFile extends BSNode {
  children   : BSNode[];
  statements : BSStatement[];
  moduleName : string;
  node       : SourceFile;

  constructor(scope: Scope, file: SourceFile, info: NodeInfo = defaultNodeInfo) {
    super(scope, file);

    this.moduleName = file.fileName;
    this.node       = file;

    scope.addScopeFor({ type: ScopeName.SourceFile, sourceFile: file });
    const sourceScope = scope.getChildScope({ type: ScopeName.SourceFile, sourceFile: file });

    this.children = flatArray(
      this.statements = buildNodeArray(sourceScope, file.statements)
    );
  }

  getLineAndCharacterOfPosition(pos: number): { line: number, character: number } {
    return this.node.getLineAndCharacterOfPosition(pos);
  }

  compile(parentScope: Scope): Sexpr[] {
    const scope = parentScope.getChildScope({ type: ScopeName.SourceFile, sourceFile: this.node });

    for (const statement of this.statements) {
      statement.compile(scope);
    }

    const functions = scope.topmostScope().functions.getAllNodes();
    scope.topmostScope().functions.clearAllNodes();

    return functions.map(fn => {
      return fn.getDeclaration(); 
    });
  }

  readableName() {
    return `Source file ${ this.moduleName }`;
  }
}
