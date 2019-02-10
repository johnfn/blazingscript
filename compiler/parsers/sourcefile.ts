import { SourceFile } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { flatArray, assertNever, normalizeString as normalizeModuleName } from "../util";
import { buildNodeArray } from "./nodeutil";

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

    for (const statement of this.statements) {
      statement.compile(ctx);
    }

    const functions = ctx.topmostScope().functions.getAllNodes();
    ctx.topmostScope().functions.clearAllNodes();

    return functions.map(fn => {
      return fn.getDeclaration(); 
    });
  }

  readableName() {
    return `Source file ${ this.moduleName }`;
  }
}
