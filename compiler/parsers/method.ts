import { ClassDeclaration, MethodDeclaration } from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context, THIS_NAME } from "../program";
import { parseStatementList } from "./statementlist";
import { addDeclarationsToContext, addParameterListToContext } from "./function";

export function parseMethod(
  ctx   : Context,
  node  : MethodDeclaration,
  parent: ClassDeclaration
): Sexpr {
  ctx.pushScope();

  ctx.addMethod({ node, parent });

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