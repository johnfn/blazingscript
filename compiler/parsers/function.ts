import { FunctionDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { compileStatementList } from "./statementlist";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSNode, defaultNodeInfo, NodeInfo, CompileResultExpr, CompileResultStatements } from "./bsnode";
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
  fileName   : string;
  scope      : Scope;
  typeParams : string[];

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
  }

  compile(parentScope: Scope): CompileResultStatements {
    const fn = parentScope.functions.getByType(this.tsType);

    const params             = this.scope.getParameters(this.parameters);
    const compiledStatements = compileStatementList(this.scope, this.body!.children);
    let lastStatement        : Sexpr | null = null;

    if (compiledStatements.statements.length > 0) {
      lastStatement = compiledStatements.statements[compiledStatements.statements.length - 1];
    }

    const wasmReturn = lastStatement && lastStatement.type === "i32" ? undefined : S.Const(0);

    let functions: Sexpr[] = [];

    if (fn.supportedTypeParams.length > 0) {
      for (const type of fn.supportedTypeParams) {
        this.scope.typeParams.add({ name: this.typeParams[0], substitutedType: type });

        functions.push(
          S.Func({
            name  : fn.getFullyQualifiedName(type),
            params: params,
            body  : [
              ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
              ...compiledStatements.statements,
              ...(wasmReturn ? [wasmReturn] : [])
            ]
          })
        );
      }
    } else {
      functions = [
        S.Func({
          name  : fn.getFullyQualifiedName(),
          params: params,
          body  : [
            ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
            ...compiledStatements.statements,
            ...(wasmReturn ? [wasmReturn] : [])
          ]
        })
      ];
    }

    return {
      statements: [],
      functions : [
        ...functions,
        ...compiledStatements.functions,
      ],
    };
  }

  readableName(): string {
    if (this.name) {
      return `function ${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}
