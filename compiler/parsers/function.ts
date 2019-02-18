import { FunctionDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { Function } from "../scope/functions";
import { parseStatementListBS } from "./statementlist";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flattenArray } from "../util";

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
  fileName   : string;
  scope      : Scope;
  typeParams : string[];

  private declaration: Sexpr[] | null = null;

  constructor(parentScope: Scope, node: FunctionDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(parentScope, node);

    this.name       = node.name ? node.name.text : null;
    this.fileName   = parentScope.sourceFile.fileName;
    this.scope      = parentScope.addScopeFor({ type: ScopeName.Function, symbol: this.tsType.symbol });
    this.typeParams = node.typeParameters ? node.typeParameters.map(x => x.getText()) : [];

    this.children  = flattenArray(
      this.body       = buildNode(this.scope, node.body),
      this.parameters = buildNodeArray(this.scope, node.parameters),
    );

    this.fn = parentScope.functions.addFunction(this.tsType);
  }

  compile(parentScope: Scope): Sexpr {
    const params     = this.scope.getParameters(this.parameters);
    const statements = parseStatementListBS(this.scope, this.body!.children);
    let lastStatement: Sexpr | null = null;

    if (statements.length > 0) {
      lastStatement = statements[statements.length - 1];
    }

    const wasmReturn = lastStatement && lastStatement.type === "i32" ? undefined : S.Const(0);

    this.declaration = [];

    if (this.fn.supportedTypeParams.length > 0) {
      for (const type of this.fn.supportedTypeParams) {
        this.scope.typeParams.add({ name: this.typeParams[0], substitutedType: type });

        this.declaration.push(
          S.Func({
            name  : this.fn.getFullyQualifiedName(type),
            params: params,
            body  : [
              ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
              ...statements,
              ...(wasmReturn ? [wasmReturn] : [])
            ]
          })
        );
      }
    } else {
      this.declaration = [
        S.Func({
          name  : this.fn.getFullyQualifiedName(),
          params: params,
          body  : [
            ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
            ...statements,
            ...(wasmReturn ? [wasmReturn] : [])
          ]
        })
      ];
    }
    
    parentScope.functions.addCompiledFunctionNode(this);

    return S.Const(0);
  }

  getDeclaration(): Sexpr[] {
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
