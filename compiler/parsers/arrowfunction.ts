import { Block, BreakStatement, ArrowFunction, SyntaxKind, Expression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { Function } from "../scope/functions";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flattenArray } from "../util";
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
  scope : Scope;

  constructor(parentScope: Scope, node: ArrowFunction, info: NodeInfo = defaultNodeInfo) {
    super(parentScope, node);

    this.scope = parentScope.addScopeFor({ type: ScopeName.ArrowFunction, node: this });

    this.body      = node.body.kind === SyntaxKind.Block
      ? buildNode(this.scope, node.body as Block)
      : buildNode(this.scope, node.body as Expression);
    this.parameters = buildNodeArray(this.scope, node.parameters);
    this.children   = flattenArray(this.parameters, this.body);

    this.fn = parentScope.functions.addFunction(this.tsType);
  }

  readableName(): string {
    return "Arrow function";
  }

  compile(parentScope: Scope): Sexpr {
    // TODO - this is copied from function

    const params = this.scope.getParameters(this.parameters);
    let content  : Sexpr[];

    if (this.body instanceof BSBlock) {
      const statements  = parseStatementListBS(this.scope, this.body.children);
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
        content = [this.body.compile(this.scope)];
      } else {
        content = [S.Const(0)];
      }
    }

    this.declaration = S.Func({
      name  : this.fn.getFullyQualifiedName(),
      params: params,
      body  : [
        ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...content,
      ]
    });

    parentScope.functions.addCompiledFunctionNode(this);

    return S.Const(this.fn.getTableIndex());
  }

  getDeclaration(): Sexpr {
    if (this.declaration === null) {
      throw new Error("This arrow function needs to be compiled before it has a declaration ready.");
    }

    return this.declaration;
  }
}
