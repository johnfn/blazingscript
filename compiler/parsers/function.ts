import { FunctionDeclaration, NodeArray, ParameterDeclaration, SyntaxKind, TypeFlags, VariableDeclaration, ForStatement, VariableDeclarationList, VariableStatement, BindingName } from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context } from "../program";
import { parseStatementList } from "./statementlist";

export function parseFunction(
  ctx: Context,
  node: FunctionDeclaration
): Sexpr {
  const functionName = node.name!.text;
  const params = parseParameterList(ctx, node.parameters, functionName)
  const sb = parseStatementList(ctx, node.body!.statements);
  const allVarDecls: { name: BindingName, type: "i32" }[] = [];

  // traverse function ahead of time to find variable declarations, which need to go up front

  for (const statement of node.body!.statements) {
    const rawdecls: VariableDeclaration[] = [];

    if (statement.kind === SyntaxKind.ForStatement) {
      const fs = statement as ForStatement;

      if (fs.initializer && fs.initializer.kind === SyntaxKind.VariableDeclarationList) {
        const vdl = fs.initializer as VariableDeclarationList;

        for (const decl of vdl.declarations) {
          rawdecls.push(decl);
        }
      }
    }

    if (statement.kind === SyntaxKind.VariableStatement) {
      const vs = statement as VariableStatement;

      for (const decl of vs.declarationList.declarations) {
        rawdecls.push(decl);
      }
    }

    for (const decl of rawdecls) {
      const type = ctx.typeChecker.getTypeAtLocation(decl);

      if ((type.flags & TypeFlags.Number) || (type.flags & TypeFlags.NumberLiteral)) {
        allVarDecls.push({
          name: decl.name,
          type: "i32",
        });
      } else if (type.flags & TypeFlags.StringLiteral || type.flags & TypeFlags.String) {
        allVarDecls.push({
          name: decl.name,
          type: "i32",
        });
      } else {
        throw new Error(`Do not know how to handle that type: ${ TypeFlags[type.flags] } for ${ statement.getText() }`);
      }
    }
  }

  return S.Func({
    name: functionName,
    body: [
      ...(allVarDecls.map(decl => S.DeclareLocal(decl.name.getText(), decl.type))),
      S.DeclareLocal("myslocal", "i32"), // TODO: check ahead of time rather than blindly adding them all now.
      ...sb
    ],
    params: params
  });
}

function parseParameterList(
  program: Context,
  nodes: NodeArray<ParameterDeclaration>, 
  functionName: string
): Param[] {
  const result: Param[] = [];

  for (const n of nodes) {
    const type = program.typeChecker.getTypeAtLocation(n);
    let wasmType = "";

    if (type.flags & TypeFlags.Number || type.flags & TypeFlags.String) {
      wasmType = "i32";
    } else {
      if (functionName !== "clog") {
        throw new Error("Unsupported type!")
      } else {
        wasmType = "i32";
      }
    }

    result.push({
      name       : n.name.getText(),
      type       : wasmType,
      declaration: n,
    });
  }

  return result;
}
