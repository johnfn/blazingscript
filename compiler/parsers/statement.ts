import { Context } from "../program";
import { Statement, SyntaxKind, ExpressionStatement, ReturnStatement, FunctionDeclaration, Block, IfStatement, VariableStatement, ForStatement } from "typescript";
import { Sexpr } from "../sexpr";
import { parseExpressionStatement } from "./expressionstatement";
import { parseReturnStatement } from "./return";
import { parseFunction } from "./function";
import { parseBlock } from "./block";
import { parseIfStatement } from "./if";
import { parseVariableStatement } from "./variablestatement";
import { parseForStatement } from "./for";

export function parseStatement(ctx: Context, statement: Statement): Sexpr | null {
  switch (statement.kind) {
    case SyntaxKind.ExpressionStatement:
      return parseExpressionStatement(ctx, statement as ExpressionStatement);
    case SyntaxKind.ReturnStatement:
      return parseReturnStatement(ctx, statement as ReturnStatement);
    case SyntaxKind.FunctionDeclaration:
      return parseFunction(ctx, statement as FunctionDeclaration);
    case SyntaxKind.Block:
      return parseBlock(ctx, statement as Block);
    case SyntaxKind.IfStatement:
      return parseIfStatement(ctx, statement as IfStatement);
    case SyntaxKind.VariableStatement:
      return parseVariableStatement(ctx, statement as VariableStatement);
    case SyntaxKind.ForStatement:
      return parseForStatement(ctx, statement as ForStatement);
    case SyntaxKind.TypeAliasDeclaration:
    case SyntaxKind.InterfaceDeclaration:
      return null;
    default:
      throw new Error(`unhandled statement! ${ SyntaxKind[statement.kind] }`);
  }
}
