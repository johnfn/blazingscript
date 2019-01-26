import { Context } from "../context";
import { Statement, SyntaxKind, ExpressionStatement, ReturnStatement, FunctionDeclaration, Block, IfStatement, VariableStatement, ForStatement, BreakStatement, ContinueStatement, ClassDeclaration } from "typescript";
import { Sexpr } from "../sexpr";
import { parseExpressionStatement } from "./expressionstatement";
import { parseReturnStatement } from "./return";
import { parseBlock } from "./block";
import { parseIfStatement } from "./if";
import { parseVariableStatement } from "./variablestatement";
import { parseForStatement } from "./for";
import { parseBreak } from "./break";
import { parseContinue } from "./continue";

export function parseStatement(ctx: Context, statement: Statement): Sexpr | null {
  switch (statement.kind) {
    case SyntaxKind.ExpressionStatement:
      return parseExpressionStatement(ctx, statement as ExpressionStatement);
    case SyntaxKind.ReturnStatement:
      return parseReturnStatement(ctx, statement as ReturnStatement);
    //   return parseFunction(ctx, statement as FunctionDeclaration);
    case SyntaxKind.Block:
      return parseBlock(ctx, statement as Block);
    case SyntaxKind.IfStatement:
      return parseIfStatement(ctx, statement as IfStatement);
    case SyntaxKind.VariableStatement:
      return parseVariableStatement(ctx, statement as VariableStatement);
    case SyntaxKind.ForStatement:
      return parseForStatement(ctx, statement as ForStatement);
    case SyntaxKind.BreakStatement:
      return parseBreak(ctx, statement as BreakStatement);
    case SyntaxKind.ContinueStatement:
      return parseContinue(ctx, statement as ContinueStatement);

    // these generate no code.

    case SyntaxKind.TypeAliasDeclaration:
    case SyntaxKind.InterfaceDeclaration:
      return null;

    // these are preprocessed in parseSourceFile.

    case SyntaxKind.FunctionDeclaration:
      return null;
    case SyntaxKind.ClassDeclaration:
      return null;
    default:
      throw new Error(`unhandled statement! ${ SyntaxKind[statement.kind] }`);
  }
}
