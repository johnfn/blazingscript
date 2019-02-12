import { ClassDeclaration, MethodDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope, ScopeName } from "../scope/scope";
import { Function, Functions } from "../scope/functions";
import { THIS_NAME } from "../program";
import { parseStatementListBS } from "./statementlist";
import { assertNever, flatArray } from "../util";
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
  declaration: Sexpr  | null = null;
  methodInfo : {
    className         : string;
    methodName        : string;
    fullyQualifiedName: string;
  };

  constructor(
    scope : Scope,
    node  : MethodDeclaration,
    info  : NodeInfo = defaultNodeInfo
  ) {
    super(scope, node);

    this.methodInfo = Functions.GetMethodTypeInfo(scope, this.tsType);

    scope.addScopeFor({ type: ScopeName.Method, symbol: this.tsType.symbol });
    const childScope = scope.getChildScope({ type: ScopeName.Method, symbol: this.tsType.symbol }); {
      this.children = flatArray(
        this.decorators = buildNodeArray(childScope, node.decorators),
        this.parameters = buildNodeArray(childScope, node.parameters),
        this.body       = buildNode(childScope, node.body),
      );

      this.name = node.name ? node.name.getText() : null;
    }
 }

  compile(parentScope: Scope): Sexpr {
    const scope = parentScope.getChildScope({ type: ScopeName.Method, symbol: this.tsType.symbol });

    const params = scope.getParameters(this.parameters);
    const sb     = parseStatementListBS(scope, this.body!.children);

    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    this.declaration = S.Func({
      name: this.methodInfo.fullyQualifiedName,
      params: [
        {
          name: THIS_NAME,
          type: "i32"
        },
        ...params
      ],
      body: [
        ...scope.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...sb,
        ...(ret ? [ret] : [])
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
      return `Method: ${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}