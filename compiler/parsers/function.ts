import { FunctionDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { Function } from "../scope/functions";
import { parseStatementListBS } from "./statementlist";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. function myFn() { }
 *      ^^^^^^^^^^^^^^^^^^^
 */
export class BSFunctionDeclaration extends BSNode {
  children   : BSNode[];
  parameters : BSParameter[];
  body       : BSBlock | null;
  name       : string | null;
  fn         : Function;
  moduleName : string;

  private declaration: Sexpr | null = null;

  constructor(ctx: Scope, node: FunctionDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    if (!ctx.moduleName) {
      throw new Error("no module name when creating function.");
    }

    this.name       = node.name ? node.name.text : null;
    this.moduleName = ctx.moduleName;

    ctx.addScopeFor({ type: ScopeName.Function, symbol: this.tsType.symbol });
    const childCtx = ctx.getChildScope({ type: ScopeName.Function, symbol: this.tsType.symbol }); {
      this.children = flatArray(
        this.body       = buildNode(childCtx, node.body),
        this.parameters = buildNodeArray(childCtx, node.parameters),
      );
    }

    this.fn = ctx.functions.addFunction(this);
  }

  compile(parentCtx: Scope): Sexpr {
    const ctx        = parentCtx.getChildScope({ type: ScopeName.Function, symbol: this.tsType.symbol });
    const params     = ctx.getParameters(this.parameters);
    const statements = parseStatementListBS(ctx, this.body!.children);
    let lastStatement: Sexpr | null = null;

    if (statements.length > 0) {
      lastStatement = statements[statements.length - 1];
    }

    const wasmReturn = lastStatement && lastStatement.type === "i32" ? undefined : S.Const(0);

    this.declaration = S.Func({
      name  : this.fn.fullyQualifiedName,
      params: params,
      body  : [
        ...ctx.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...statements,
        ...(wasmReturn ? [wasmReturn] : [])
      ]
    });
    
    parentCtx.functions.addCompiledFunctionNode(this);

    return S.Const(0);
  }

  getDeclaration(): Sexpr {
    if (this.declaration) {
      return this.declaration;
    }

    throw new Error("This BSFunctionNode needs to be compiled before it has a declaration available.");
  }

  readableName(): string {
    if (this.name) {
      return `function ${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}
