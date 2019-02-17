import { ClassDeclaration, MethodDeclaration, Type } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { Function, Functions } from "../scope/functions";
import { THIS_NAME } from "../program";
import { parseStatementListBS } from "./statementlist";
import { assertNever, flattenArray } from "../util";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSDecorator } from "./decorator";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSStringLiteral } from "./stringliteral";
import { buildNode, buildNodeArray } from "./nodeutil";
import { BSClassDeclaration } from "./class";

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
  declaration: Sexpr[] | null = null;
  scope      : Scope;
  methodInfo : {
    className         : string;
    methodName        : string;
    fullyQualifiedName: string;
    classType         : Type;
  };
  typeParams : string[];

  constructor(
    scope : Scope,
    node  : MethodDeclaration,
    info  : NodeInfo = defaultNodeInfo
  ) {
    super(scope, node);

    this.methodInfo = Functions.GetMethodTypeInfo(scope, this.tsType);
    this.typeParams = node.typeParameters ? node.typeParameters.map(x => x.getText()) : [];

    this.scope = scope.addScopeFor({ type: ScopeName.Method, symbol: this.tsType.symbol });
    this.children = flattenArray(
      this.decorators = buildNodeArray(this.scope, node.decorators),
      this.parameters = buildNodeArray(this.scope, node.parameters),
      this.body       = buildNode(this.scope, node.body),
    );

    this.name = node.name ? node.name.getText() : null;
 }

  compile(parentScope: Scope): Sexpr {
    const params = this.scope.getParameters(this.parameters);
    const sb     = parseStatementListBS(this.scope, this.body!.children);

    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    this.declaration = [];

    // TODO: Remove this hackery. 

    const obj = this.scope.getScopeForClass(this.methodInfo.classType);

    if (!obj) { throw new Error("this is a really bad error.") }

    const { className, cls } = obj;

    const fn = cls.functions.list.filter(fn => fn.name === this.name && fn.className === className)[0];
    if (!fn) { throw new Error("function not found...") }

    if (fn.supportedTypeParams.length > 0) {
      for (const type of fn.supportedTypeParams) {
        this.scope.typeParams.add({ name: this.typeParams[0], substitutedType: type });

        this.declaration.push(S.Func({
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
            ...sb,
            ...(ret ? [ret] : [])
          ]
        }));
      }
    } else {
      this.declaration = [S.Func({
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
          ...sb,
          ...(ret ? [ret] : [])
        ]
      })];
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
      return `Method: ${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}