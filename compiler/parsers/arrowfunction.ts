import { Block, BreakStatement, ArrowFunction, SyntaxKind, Expression } from "typescript";
import { Sexpr, S, sexprToString } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { Function } from "../scope/functions";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flattenArray, Util } from "../util";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSExpression } from "./expression";
import { compileStatementList } from "./statementlist";

/**
 * e.g. const x = (arg: number) => arg + 1;
 *                ^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSArrowFunction extends BSNode {
  children   : BSNode[] = [];
  parameters : BSParameter[];
  body       : BSBlock | BSExpression | null;
  scope : Scope;

  constructor(parentScope: Scope, node: ArrowFunction, info: NodeInfo = defaultNodeInfo) {
    super(parentScope, node);

    this.scope = parentScope.addScopeFor({ type: ScopeName.ArrowFunction, node: this });

    this.body      = node.body.kind === SyntaxKind.Block
      ? buildNode(this.scope, node.body as Block)
      : buildNode(this.scope, node.body as Expression);
    this.parameters = buildNodeArray(this.scope, node.parameters);
    this.children   = flattenArray(this.parameters, this.body);
  }

  readableName(): string {
    return "Arrow function";
  }

  compile(parentScope: Scope): CompileResultExpr {
    const fn = parentScope.functions.getByType(this.tsType);

    const params = this.scope.getParameters(this.parameters);
    let content  : Sexpr[];
    let functions: Sexpr[] = [];

    if (this.body instanceof BSBlock) {
      const compiled = compileStatementList(this.scope, this.body.children);
      let lastStatement: Sexpr | null = null;

      if (compiled.statements.length > 0) {
        lastStatement = compiled.statements[compiled.statements.length - 1];
      }
      const wasmReturn = lastStatement && lastStatement.type === "i32" ? undefined : S.Const(0);

      content = [
        ...compiled.statements,
        ...(wasmReturn ? [wasmReturn] : [])
      ];
      functions = compiled.functions;
    } else {
      if (this.body) {
        const compiledBody = this.body.compile(this.scope);

        content = [compiledBody.expr];
        functions = [...functions, ...compiledBody.functions];
      } else {
        throw new Error("no function body at all?")
      }
    }

    const fnExpr = S.Func({
      name  : fn.getFullyQualifiedName(),
      params: params,
      body  : [
        ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...content,
      ]
    });

    return {
      expr     : S.Const(fn.getTableIndex()),
      functions: [...functions, fnExpr]
    };
  }
}
