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
  fullText  : string;

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

    this.decorators = [...(node.decorators || [])].map(deco => new BSDecorator(ctx, deco));

    this.body = node.body ? new BSBlock(ctx, node.body) : null;
    this.parameters = [...node.parameters].map(
      param => new BSParameter(ctx, param)
    );
    this.children = [
      ...this.decorators,
      ...this.parameters, 
      ...(this.body ? [this.body] : [])
    ];

    this.name = node.name ? node.name.getText() : null;
    this.fullText = node.getFullText();

    this.parentNodeREMOVE = parentNode;
 }

  compile(ctx: Context): Sexpr {
    ctx.pushScope();

    let overload: OperatorOverload | null = null;

    for (const deco of this.decorators) {
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

    ctx.addMethod({ node: this, parent: this.parentNodeREMOVE, overload });

    ctx.addDeclarationsToContext(this);

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
}