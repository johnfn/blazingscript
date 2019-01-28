import {
  ClassDeclaration,
  MethodDeclaration,
  SyntaxKind,
  CallExpression,
  FunctionDeclaration
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { THIS_NAME } from "../program";
import { parseStatementList } from "./statementlist";
import {
  addDeclarationsToContext,
  addParameterListToContext
} from "./function";
import { assertNever } from "../util";
import { BSNode } from "./bsnode";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";

export enum Operator {
  "===" = "===",
  "!==" = "!==",
  "+" = "+"
}

export type OperatorOverload = {
  operator: Operator;
};

export class BSMethodDeclaration extends BSNode {
  children: BSNode[];
  parameters: BSParameter[];
  body: BSBlock | null;

  name: string | null;
  fullText: string;

  nodeREMOVE: MethodDeclaration;
  parentNodeREMOVE: ClassDeclaration;

  constructor(
    ctx: Context,
    node: MethodDeclaration,
    parentNode: ClassDeclaration
  ) {
    super(ctx, node);

    this.body = node.body ? new BSBlock(ctx, node.body) : null;
    this.parameters = [...node.parameters].map(
      param => new BSParameter(ctx, param)
    );
    this.children = [...this.parameters, ...(this.body ? [this.body] : [])];

    this.name = node.name ? node.name.getText() : null;
    this.fullText = node.getFullText();

    this.nodeREMOVE = node;
    this.parentNodeREMOVE = parentNode;
  }

  compile(ctx: Context): Sexpr {
    return parseMethod(ctx, this.nodeREMOVE, this.parentNodeREMOVE);
  }
}

export function parseMethod(
  ctx: Context,
  node: MethodDeclaration,
  parent: ClassDeclaration
): Sexpr {
  ctx.pushScope();

  let overload: OperatorOverload | null = null;

  for (const deco of node.decorators || []) {
    if (deco.expression.kind === SyntaxKind.CallExpression) {
      const ce = deco.expression as CallExpression;

      if (ce.expression.getText() === "operator") {
        const opName: Operator = ce.arguments[0]
          .getText()
          .slice(1, -1) as Operator;

        if (opName === Operator["!=="]) {
          overload = {
            operator: Operator["!=="]
          };
        } else if (opName === Operator["+"]) {
          overload = {
            operator: Operator["+"]
          };
        } else if (opName === Operator["==="]) {
          overload = {
            operator: Operator["==="]
          };
        } else {
          assertNever(opName);
        }
      }
    }
  }

  ctx.addMethod({
    node,
    parent,
    overload
  });

  addDeclarationsToContext(node, ctx);

  const params = addParameterListToContext(ctx, node.parameters);
  const sb = parseStatementList(ctx, node.body!.statements);
  let last: Sexpr | null = null;

  if (sb.length > 0) {
    last = sb[sb.length - 1];
  }

  const ret = last && last.type === "i32" ? undefined : S.Const("i32", 0);

  const result = S.Func({
    name: ctx.getFunctionByNode(node).bsname,
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
