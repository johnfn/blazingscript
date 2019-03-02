import { ClassDeclaration, MethodDeclaration, Type } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { THIS_NAME } from "../program";
import { compileStatementList } from "./statementlist";
import { assertNever, flattenArray } from "../util";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSDecorator } from "./decorator";
import { buildNode, buildNodeArray } from "./nodeutil";

/**
 * e.g. class Foo { method() { } }
 *                  ^^^^^^^^^^^^
 */
export class BSMethodDeclaration extends BSNode {
  children   : BSNode[];
  parameters : BSParameter[];
  body       : BSBlock | null;

  /**
   * Name of the method.
   */
  name       : string | null;

  decorators : BSDecorator[];
  scope      : Scope;
  typeParams : string[];

  constructor(
    scope : Scope,
    node  : MethodDeclaration,
    info  : NodeInfo = defaultNodeInfo
  ) {
    super(scope, node);

    this.typeParams = node.typeParameters ? node.typeParameters.map(x => x.getText()) : [];

    this.scope = scope.addScopeFor({ type: ScopeName.Method, symbol: this.tsType.symbol });
    this.children = flattenArray(
      this.decorators = buildNodeArray(this.scope, node.decorators),
      this.parameters = buildNodeArray(this.scope, node.parameters),
      this.body       = buildNode(this.scope, node.body),
    );

    this.name = node.name ? node.name.getText() : null;
 }

  compile(parentScope: Scope): CompileResultExpr {
    const params = this.scope.getParameters(this.parameters);
    const statementsCompiled = compileStatementList(this.scope, this.body!.children);

    let last: Sexpr | null = null;

    if (statementsCompiled.statements.length > 0) {
      last = statementsCompiled.statements[statementsCompiled.statements.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    let functions = [];

    const fn = parentScope.functions.getByType(this.tsType);

    if (fn.supportedTypeParams.length > 0) {
      for (const type of fn.supportedTypeParams) {
        this.scope.typeParams.add({ name: this.typeParams[0], substitutedType: type });

        functions.push(S.Func({
          name: fn.getFullyQualifiedName(type),
          params: [
            {
              name: THIS_NAME,
              type: "i32"
            },
            ...params
          ],
          body: [
            ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
            ...statementsCompiled.statements,
            ...(ret ? [ret] : [])
          ]
        }));
      }
    } else {
      functions = [S.Func({
        name: fn.getFullyQualifiedName(""),
        params: [
          {
            name: THIS_NAME,
            type: "i32"
          },
          ...params
        ],
        body: [
          ...this.scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
          ...statementsCompiled.statements,
          ...(ret ? [ret] : [])
        ]
      })];
    }

    return {
      expr     : S.Const(0),
      functions,
    }
  }

  readableName(): string {
    if (this.name) {
      return `Method: ${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}