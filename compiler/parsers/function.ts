import { FunctionDeclaration, NodeArray, ParameterDeclaration, SyntaxKind, TypeFlags, VariableDeclaration, ForStatement, VariableDeclarationList, VariableStatement, BindingName, Identifier, createTextChangeRange } from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context } from "../program";
import { parseStatementList } from "./statementlist";

export function parseFunction(
  oldContext: Context,
  node      : FunctionDeclaration
): Sexpr {
  const ctx = oldContext.clone();

  const functionName = node.name!.text;
  const allVarDecls: { name: BindingName, type: "i32" }[] = [];

  ctx.addFunction(functionName, node, functionName.startsWith("__inline"));

  // traverse function ahead of time to find variable declarations, which need to go up front

  const rawdecls = getAllDecls(node);

  for (const decl of rawdecls) {
    const type = ctx.typeChecker.getTypeAtLocation(decl);

    if (
      (type.flags & TypeFlags.Number) || 
      (type.flags & TypeFlags.NumberLiteral) ||
      (type.flags & TypeFlags.StringLiteral) || 
      (type.flags & TypeFlags.String)
    ) {
      allVarDecls.push({
        name: decl.name,
        type: "i32",
      });

      if (decl.kind & SyntaxKind.Identifier) {
        ctx.addVariableToScope((decl.name as Identifier).text, type);
      } else {
        throw new Error(`do not know how to handle that type of declaration identifier: ${ SyntaxKind[decl.kind] }`);
      }
    } else {
      throw new Error(`Do not know how to handle that type: ${ TypeFlags[type.flags] } for ${ decl.getText() }`);
    }
  }

  ctx.addVariableToScope("myslocal", undefined);

  // now that we've set up ctx with the appropriate variable mappings, build the function

  const params = parseParameterList(ctx, node.parameters, functionName)
  const sb = parseStatementList(ctx, node.body!.statements);

  return S.Func({
    name: functionName,
    params: params,
    body: [
      ...(allVarDecls.map(decl => S.DeclareLocal(decl.name.getText(), decl.type))),
      S.DeclareLocal("myslocal", "i32"), // TODO: check ahead of time rather than blindly adding them all now.
      ...sb
    ],
  });
}

function parseParameterList(
  ctx: Context,
  nodes: NodeArray<ParameterDeclaration>, 
  functionName: string
): Param[] {
  const result: Param[] = [];

  for (const n of nodes) {
    const type = ctx.typeChecker.getTypeAtLocation(n);
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

    ctx.addVariableToScope(n.name.getText(), type);
  }

  return result;
}

function getAllDecls(node: FunctionDeclaration): VariableDeclaration[] {
  const rawdecls: VariableDeclaration[] = [];

  if (!node.body) {
    return rawdecls;
  }

  for (const statement of node.body!.statements) {
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
  }

  return rawdecls;
}