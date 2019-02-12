import { Block, BreakStatement, ArrowFunction, SyntaxKind, Expression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
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

  constructor(scope: Scope, node: ArrowFunction, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    scope.addScopeFor({ type: ScopeName.ArrowFunction, node: this });
    const childScope = scope.getChildScope({ type: ScopeName.ArrowFunction, node: this }); {
      this.body      = node.body.kind === SyntaxKind.Block
        ? buildNode(childScope, node.body as Block)
        : buildNode(childScope, node.body as Expression);
      this.parameters = buildNodeArray(childScope, node.parameters);
      this.children   = flatArray(this.parameters, this.body);
    }

    this.fn = scope.functions.addFunction(this);
  }

  readableName(): string {
    return "Arrow function";
  }

  compile(scope: Scope): Sexpr {
    // TODO - wait, why is this a separate function?

    this.compileDeclaration(scope);

    scope.functions.addCompiledFunctionNode(this);

    return S.Const(this.fn.tableIndex);
  }

  getDeclaration(): Sexpr {
    if (this.declaration === null) {
      throw new Error("This arrow function needs to be compiled before it has a declaration ready.");
    }

    return this.declaration;
  }

  compileDeclaration(parentScope: Scope): void {
    // TODO - this is copied from function

    const scope  = parentScope.getChildScope({ type: ScopeName.ArrowFunction, node: this })
    const params = scope.getParameters(this.parameters);
    let content  : Sexpr[];

    if (this.body instanceof BSBlock) {
      const statements  = parseStatementListBS(scope, this.body.children);
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
        content = [this.body.compile(scope)];
      } else {
        content = [S.Const(0)];
      }
    }

    this.declaration = S.Func({
      name  : this.fn.fullyQualifiedName,
      params: params,
      body  : [
        ...scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...content,
      ]
    });
  }
}
