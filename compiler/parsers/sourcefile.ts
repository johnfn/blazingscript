import { SourceFile } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSFunctionDeclaration } from "./function";
import { BSMethodDeclaration } from "./method";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { BSClassDeclaration } from "./class";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { flatArray, assertNever } from "../util";
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
  children         : BSNode[];
  statements       : BSStatement[];
  fileName         : string;

  constructor(ctx: Scope, file: SourceFile, info: NodeInfo = defaultNodeInfo) {
    super(ctx, file);

    this.fileName = file.fileName;

    ctx.addScopeFor(this);
    const sourceCtx = ctx.getChildScope(this);

    this.children = flatArray(
      this.statements = buildNodeArray(sourceCtx, file.statements)
    );
  }

  compile(parentCtx: Scope): Sexpr[] {
    const ctx = parentCtx.getChildScope(this);
    const functions = ctx.functions.getAll(ctx.topmostScope()).sort((a, b) => a.tableIndex - b.tableIndex);

    for (const statement of this.statements) {
      statement.compile(ctx);
    }

    return functions.map(fn => {
      return fn.node.getDeclaration();
    });
  }

  readableName() {
    return `Source file ${ this.fileName }`;
  }
}
