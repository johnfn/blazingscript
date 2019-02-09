import { SourceFile } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSFunctionDeclaration } from "./function";
import { BSMethodDeclaration } from "./method";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { BSClassDeclaration } from "./class";
import { flatArray, assertNever, normalizeString as normalizeModuleName } from "../util";
import { buildNodeArray } from "./nodeutil";

type FunctionDecl = {
  node: BSFunctionDeclaration | BSMethodDeclaration;

  /**
   * The containing class (if there is one).
   */
  parent  : BSClassDeclaration | null;
  name    : string;
  exported: boolean;
};

export class BSSourceFile extends BSNode {
  children   : BSNode[];
  statements : BSStatement[];
  moduleName : string;
  node       : SourceFile;

  constructor(ctx: Scope, file: SourceFile, info: NodeInfo = defaultNodeInfo) {
    super(ctx, file);

    this.moduleName = file.fileName;
    this.node       = file;

    ctx.addScopeFor(this);
    const sourceCtx = ctx.getChildScope(this);

    this.children = flatArray(
      this.statements = buildNodeArray(sourceCtx, file.statements)
    );
  }

  getLineAndCharacterOfPosition(pos: number): { line: number, character: number } {
    return this.node.getLineAndCharacterOfPosition(pos);
  }

  compile(parentCtx: Scope): Sexpr[] {
    const ctx       = parentCtx.getChildScope(this);
    const functions = ctx.functions.getAllNodes(ctx);

    for (const statement of this.statements) {
      statement.compile(ctx);
    }

    return functions.map(fn => {
      return fn.getDeclaration(); 
    });
  }

  readableName() {
    return `Source file ${ this.moduleName }`;
  }
}
