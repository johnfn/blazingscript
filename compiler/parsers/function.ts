import { forEachChild, FunctionDeclaration, Node, NodeArray, ParameterDeclaration, SyntaxKind, TypeFlags, VariableDeclaration, ForStatement, VariableDeclarationList, VariableStatement, BindingName, Identifier, createTextChangeRange, createBigIntLiteral, Statement } from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context } from "../context";
import { parseStatementList } from "./statementlist";
import { BSNode } from "../rewriter";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";

export class BSFunctionDeclaration extends BSNode {
  children  : BSNode[];
  parameters: BSParameter[];
  body      : BSBlock | null;

  constructor(node: FunctionDeclaration) {
    super();

    this.body = node.body ? new BSBlock(node.body) : null;
    this.parameters = [...node.parameters].map(param => new BSParameter(param));

    this.children = [
      ...this.parameters,
      ...(this.body ? [this.body] : []),
    ];
  }
}

export function parseFunction(
  ctx : Context,
  node: FunctionDeclaration
): Sexpr {

  ctx.pushScope();

  ctx.addFunction(node);

  // traverse function ahead of time to find variable declarations, which need to go up front

  addDeclarationsToContext(node, ctx);

  // now that we've set up ctx with the appropriate variable mappings, build the function

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

export function addDeclarationsToContext(node: Node, ctx: Context): VariableDeclaration[] {
  const decls: VariableDeclaration[] = [];

  // Step 1: gather all declarations

  const helper = (node: Node) => {
    if (node.kind === SyntaxKind.ForStatement) {
      const fs = node as ForStatement;

      if (fs.initializer && fs.initializer.kind === SyntaxKind.VariableDeclarationList) {
        for (const decl of (fs.initializer as VariableDeclarationList).declarations) {
          decls.push(decl)
        }
      }
    }

    if (node.kind === SyntaxKind.VariableStatement) {
      const vs = node as VariableStatement;

      for (const decl of vs.declarationList.declarations) {
        decls.push(decl);
      }
    }

    // skip recursing into functions!

    if (
      node.kind === SyntaxKind.FunctionDeclaration ||
      node.kind === SyntaxKind.FunctionExpression 
    ) {
      return;
    }

    forEachChild(node, helper);
  }

  forEachChild(node, helper);

  // Step 2: Add each declaration to our context

  for (const decl of decls) {
    const type = ctx.typeChecker.getTypeAtLocation(decl);

    if (
      (type.flags & TypeFlags.Number) || 
      (type.flags & TypeFlags.NumberLiteral) ||
      (type.flags & TypeFlags.StringLiteral) || 
      (type.flags & TypeFlags.String)
    ) {
      if (decl.kind & SyntaxKind.Identifier) {
        ctx.addVariableToScope((decl.name as Identifier).text, type, "i32");
      } else {
        throw new Error(`do not know how to handle that type of declaration identifier: ${ SyntaxKind[decl.kind] }`);
      }
    } else {
      throw new Error(`Do not know how to handle that type: ${ TypeFlags[type.flags] } for ${ decl.getText() }`);
    }
  }

  // TODO: check ahead of time rather than blindly adding them all now.
  ctx.addVariableToScope("myslocal", undefined, "i32");

  return decls;
}

export function addParameterListToContext(
  ctx: Context,
  nodes: NodeArray<ParameterDeclaration>
): Param[] {
  const result: Param[] = [];

  for (const n of nodes) {
    const type = ctx.typeChecker.getTypeAtLocation(n);
    let wasmType: "i32";

    if (type.flags & TypeFlags.Number || type.flags & TypeFlags.String) {
      wasmType = "i32";
    } else {
      throw new Error("Unsupported type!")
    }

    result.push({
      name       : n.name.getText(),
      type       : wasmType,
    });

    ctx.addVariableToScope(n.name.getText(), type, wasmType, true);
  }

  return result;
}