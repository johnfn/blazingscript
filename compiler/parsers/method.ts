import { ClassDeclaration, MethodDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
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

export enum Operator {
  TripleEquals = "===",
  NotEquals    = "!==",
  Add          = "+",
  ArrayIndex   = "[]",
};

export type OperatorOverload = {
  operator: Operator;
};

/**
 * e.g. class Foo { method() { } }
 *                  ^^^^^^^^^^^^
 */
export class BSMethodDeclaration extends BSNode {
  children  : BSNode[];
  parameters: BSParameter[];
  body      : BSBlock | null;

  /**
   * Name of the method.
   */
  name      : string | null;

  decorators: BSDecorator[];
  parent    : BSClassDeclaration;

  constructor(
    ctx       : Scope,
    node      : MethodDeclaration,
    parentNode: BSClassDeclaration,
    info      : NodeInfo = defaultNodeInfo
  ) {
    super(ctx, node);

    this.parent = parentNode;

    ctx.addScopeFor(this);
    const childCtx = ctx.getChildScope(this); {
      this.children = flatArray(
        this.decorators = buildNodeArray(childCtx, node.decorators),
        this.parameters = buildNodeArray(childCtx, node.parameters),
        this.body       = buildNode(childCtx, node.body),
      );

      this.name = node.name ? node.name.getText() : null;
    }

    ctx.functions.addMethod({
      node    : this,
      parent  : this.parent,
      overload: this.getOverloadType(this.decorators),
    });
 }

  getOverloadType(decorators: BSDecorator[]): OperatorOverload | null {
    for (const deco of decorators) {
      if (!(deco.expression instanceof BSCallExpression)) {
        continue;
      }

      if (!(deco.expression.expression instanceof BSIdentifier)) {
        continue;
      }

      const calledFunction = deco.expression.expression.text;

      if (calledFunction === "operator") {
        const firstArgument = deco.expression.arguments[0];

        if (!(firstArgument instanceof BSStringLiteral)) {
          continue;
        }

        const opName = firstArgument.text as Operator;

        if (opName === Operator.NotEquals) {
          return { operator: Operator.NotEquals };
        } else if (opName === Operator.Add) {
          return { operator: Operator.Add };
        } else if (opName === Operator.TripleEquals) {
          return { operator: Operator.TripleEquals };
        } else if (opName === Operator.ArrayIndex) {
          return { operator: Operator.ArrayIndex };
        } else {
          assertNever(opName);
        }
      }
    }

    return null;
  }

  compile(parentCtx: Scope): Sexpr {
    const ctx = parentCtx.getChildScope(this);

    const params = ctx.getParameters(this.parameters);
    const sb     = parseStatementListBS(ctx, this.body!.children);

    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    const result = S.Func({
      name: ctx.functions.getFunctionByNode(this).bsName,
      params: [
        {
          name: THIS_NAME,
          type: "i32"
        },
        ...params
      ],
      body: [
        ...ctx.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...sb,
        ...(ret ? [ret] : [])
      ]
    });

    return result;
  }

  readableName(): string {
    if (this.name) {
      return `Method: ${ this.parent.name }#${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}