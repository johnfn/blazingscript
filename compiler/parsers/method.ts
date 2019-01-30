import { ClassDeclaration, MethodDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { THIS_NAME } from "../program";
import { parseStatementListBS } from "./statementlist";
import { assertNever } from "../util";
import { BSNode } from "./bsnode";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSDecorator } from "./decorator";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSStringLiteral } from "./stringliteral";
import { buildNode, buildNodeArray } from "./nodeutil";

export enum Operator {
  "===" = "===",
  "!==" = "!==",
  "+"   = "+",
  "[]"  = "[]",
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

  /**
   * TODO: I cant really get rid of this until i can pass it in, which i cant do until class nodes generate all their functions
   * properly.
   */
  parentNodeREMOVE: ClassDeclaration;

  constructor(
    ctx       : Context,
    node      : MethodDeclaration,
    parentNode: ClassDeclaration
  ) {
    super(ctx, node);

    this.parentNodeREMOVE = parentNode;

    ctx.addScopeFor(this);
    ctx.pushScopeFor(this); {
      this.decorators = buildNodeArray(ctx, node.decorators);
      this.parameters = buildNodeArray(ctx, node.parameters);
      this.body       = buildNode(ctx, node.body);
      this.children = [
        ...this.decorators,
        ...this.parameters, 
        ...(this.body ? [this.body] : [])
      ];

      this.name = node.name ? node.name.getText() : null;

      ctx.addDeclarationsToContext(this);

    } ctx.popScope();

    ctx.addMethod({ 
      node    : this, 
      parent  : this.parentNodeREMOVE, 
      overload: this.getOverloadType(this.decorators),
    });
 }

 getOverloadType(decorators: BSDecorator[]): OperatorOverload | null {
  let overload: OperatorOverload | null = null;

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

      if (opName === Operator["!=="]) {
        overload = { operator: Operator["!=="] };
      } else if (opName === Operator["+"]) {
        overload = { operator: Operator["+"] };
      } else if (opName === Operator["==="]) {
        overload = { operator: Operator["==="] };
      } else if (opName === Operator["[]"]) {
        overload = { operator: Operator["[]"] };
      } else {
        assertNever(opName);
      }
    }
  }
  return overload;
 }

  compile(ctx: Context): Sexpr {
    ctx.pushScopeFor(this);

    const params = ctx.addParameterListToContext(this.parameters);
    const sb     = parseStatementListBS(ctx, this.body!.children);

    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    const result = S.Func({
      name: ctx.getFunctionByNode(this).bsname,
      params: [
        {
          name: THIS_NAME,
          type: "i32"
        },
        ...params
      ],
      body: [
        ...ctx
          .getVariablesInCurrentScope(false)
          .map(decl => S.DeclareLocal(decl.bsname, decl.wasmType)),
        ...sb,
        ...(ret ? [ret] : [])
      ]
    });

    ctx.popScope();

    return result;
  }

  readableName(): string { 
    if (this.name) {
      return `method ${ this.parentNodeREMOVE.name!.text }#${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}