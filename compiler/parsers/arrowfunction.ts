import { Block, BreakStatement, ArrowFunction, SyntaxKind, Expression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { Function } from "../scope/functions";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSExpression } from "./expression";
import { parseStatementListBS } from "./statementlist";

/**
 * e.g. const x = (arg: number) => arg + 1;
 *                ^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSArrowFunction extends BSNode {
  children   : BSNode[] = [];
  parameters : BSParameter[];
  body       : BSBlock | BSExpression | null;
  declaration: Sexpr | null = null;
  fn         : Function;

  constructor(ctx: Scope, node: ArrowFunction, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    ctx.addScopeFor(this);
    const childCtx = ctx.getChildScope(this); {
      this.body       = node.body.kind === SyntaxKind.Block
        ? buildNode(childCtx, node.body as Block)
        : buildNode(childCtx, node.body as Expression);
      this.parameters = buildNodeArray(childCtx, node.parameters);
      this.children   = flatArray(this.parameters, this.body);
    }

    this.fn = ctx.functions.addFunction(this);
  }

  readableName(): string {
    return "Arrow function";
  }

  compile(ctx: Scope): Sexpr {
    this.compileDeclaration(ctx);

    return S.Const(this.fn.tableIndex);
  }

  getDeclaration(): Sexpr {
    if (this.declaration === null) {
      throw new Error("This arrow function needs to be compiled before it has a declaration ready.");
    }

    return this.declaration;
  }

  compileDeclaration(parentCtx: Scope): void {
    // TODO - this is copied from function

    const ctx    = parentCtx.getChildScope(this)
    const params = ctx.getParameters(this.parameters);
    let content  : Sexpr[];

    if (this.body instanceof BSBlock) {
      const statements  = parseStatementListBS(ctx, this.body.children);
      let lastStatement : Sexpr | null = null;

      if (statements.length > 0) {
        lastStatement = statements[statements.length - 1];
      }
      const wasmReturn = lastStatement && lastStatement.type === "i32" ? undefined : S.Const(0);

      content = [
        ...statements,
        ...(wasmReturn ? [wasmReturn] : [])
      ];
    } else {
      if (this.body) {
        content = [this.body.compile(ctx)];
      } else {
        content = [S.Const(0)];
      }
    }

    this.declaration = S.Func({
      name  : ctx.functions.getFunctionByNode(this).fullyQualifiedName,
      params: params,
      body  : [
        ...ctx.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...content,
      ]
    });
  }
}
