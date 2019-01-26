import { ClassDeclaration, MethodDeclaration, SyntaxKind, CallExpression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context, THIS_NAME } from "../program";
import { parseStatementList } from "./statementlist";
import { addDeclarationsToContext, addParameterListToContext } from "./function";
import { assertNever } from "../util";

export enum Operator {
  "===" = "===",
  "!==" = "!==",
  "+"   = "+",
}

export type OperatorOverload = {
  operator: Operator;
};

export function parseMethod(
  ctx   : Context,
  node  : MethodDeclaration,
  parent: ClassDeclaration
): Sexpr {
  ctx.pushScope();

  let overload: OperatorOverload | null = null;

  for (const deco of (node.decorators || [])) {
    if (deco.expression.kind === SyntaxKind.CallExpression) {
      const ce = deco.expression as CallExpression;

      if (ce.expression.getText() === "operator") {
        const opName: Operator = ce.arguments[0].getText().slice(1, -1) as Operator;

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
          assertNever(opName)
        }
      }
    }
  }

  ctx.addMethod({ 
    node, 
    parent,
    overload,
  });

  addDeclarationsToContext(node, ctx);

  const params = addParameterListToContext(ctx, node.parameters)
  const sb = parseStatementList(ctx, node.body!.statements);
  let last: Sexpr | null = null;

  if (sb.length > 0) {
    last = sb[sb.length - 1];
  }

  const ret = (last && last.type === "i32") ? undefined : S.Const("i32", 0);

  const result = S.Func({
    name: ctx.getFunctionByNode(node).bsname,
    params: [
      {
        name: THIS_NAME,
        type: "i32",
      },
      ...params
    ],
    body: [
      ...(ctx.getVariablesInCurrentScope(false).map(decl => S.DeclareLocal(decl.bsname, decl.wasmType))),
      ...sb,
      ...(ret ? [ret] : []),
    ],
  });

  ctx.popScope();

  return result;
}