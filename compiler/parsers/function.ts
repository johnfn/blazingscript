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
  fileName : string;

  private declaration: Sexpr | null = null;

  constructor(scope: Scope, node: FunctionDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    if (!scope.sourceFile.fileName) { throw new Error("module name undefined"); } // TODO - shuold be able to get rid of this error (by pushing it up)

    this.name     = node.name ? node.name.text : null;
    this.fileName = scope.sourceFile.fileName;

    scope.addScopeFor({ type: ScopeName.Function, symbol: this.tsType.symbol });
    const childScope = scope.getChildScope({ type: ScopeName.Function, symbol: this.tsType.symbol }); {
      this.children  = flatArray(
        this.body       = buildNode(childScope, node.body),
        this.parameters = buildNodeArray(childScope, node.parameters),
      );
    }

    this.fn = scope.functions.addFunction(this);
  }

  compile(parentScope: Scope): Sexpr {
    const scope      = parentScope.getChildScope({ type: ScopeName.Function, symbol: this.tsType.symbol });
    const params     = scope.getParameters(this.parameters);
    const statements = parseStatementListBS(scope, this.body!.children);
    let lastStatement: Sexpr | null = null;

    if (statements.length > 0) {
      lastStatement = statements[statements.length - 1];
    }

    const wasmReturn = lastStatement && lastStatement.type === "i32" ? undefined : S.Const(0);

    this.declaration = S.Func({
      name  : this.fn.fullyQualifiedName,
      params: params,
      body  : [
        ...scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...statements,
        ...(wasmReturn ? [wasmReturn] : [])
      ]
    });
    
    parentScope.functions.addCompiledFunctionNode(this);

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
