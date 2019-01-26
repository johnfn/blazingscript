import { ClassDeclaration, forEachChild, FunctionDeclaration, Node, NodeArray, ParameterDeclaration, SyntaxKind, TypeFlags, VariableDeclaration, ForStatement, VariableDeclarationList, VariableStatement, BindingName, Identifier, createTextChangeRange, createBigIntLiteral, Statement, MethodDeclaration } from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context } from "../program";
import { parseStatementList } from "./statementlist";
import { addDeclarationsToContext, addParameterListToContext } from "./function";

export function parseMethod(
  ctx   : Context,
  node  : MethodDeclaration,
  parent: ClassDeclaration
): Sexpr {
  ctx.pushScope();

  ctx.addFunction(node, true, parent);

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
    params: params,
    body: [
      ...(ctx.getVariablesInCurrentScope(false).map(decl => S.DeclareLocal(decl.bsname, decl.wasmType))),
      ...sb,
      ...(ret ? [ret] : []),
    ],
  });

  ctx.popScope();

  return result;
}