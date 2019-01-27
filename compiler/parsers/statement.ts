import { Context } from "../context";
import { Statement, SyntaxKind, ExpressionStatement, ReturnStatement, FunctionDeclaration, Block, IfStatement, VariableStatement, ForStatement, BreakStatement, ContinueStatement, ClassDeclaration, TypeAliasDeclaration, InterfaceDeclaration } from "typescript";
import { Sexpr } from "../sexpr";
import { parseExpressionStatement, BSExpressionStatement } from "./expressionstatement";
import { parseReturnStatement, BSReturnStatement } from "./return";
import { parseBlock, BSBlock } from "./block";
import { parseIfStatement, BSIfStatement } from "./if";
import { parseVariableStatement, BSVariableStatement } from "./variablestatement";
import { parseForStatement, BSForStatement } from "./for";
import { parseBreak, BSBreakStatement } from "./break";
import { parseContinue, BSContinueStatement } from "./continue";
import { BSNode } from "../rewriter";
import { BSTypeAliasDeclaration } from "./typealias";
import { BSInterfaceDeclaration } from "./interface";
import { BSFunctionDeclaration } from "./function";
import { BSClassDeclaration } from "./class";

export class BSStatement extends BSNode {
  children: BSNode[];
  readonly type = "Statement";

  statement: BSNode;

  constructor(statement: Statement) {
    super();

    this.statement = this.getStatement(statement);
    this.children = [this.statement];
  }

  getStatement(statement: Statement): BSNode {
    switch (statement.kind) {
      case SyntaxKind.ExpressionStatement:
        return new BSExpressionStatement(statement as ExpressionStatement);
      case SyntaxKind.ReturnStatement:
        return new BSReturnStatement(statement as ReturnStatement);
      case SyntaxKind.Block:
        return new BSBlock(statement as Block);
      case SyntaxKind.IfStatement:
        return new BSIfStatement(statement as IfStatement);
      case SyntaxKind.VariableStatement:
        return new BSVariableStatement(statement as VariableStatement);
      case SyntaxKind.ForStatement:
        return new BSForStatement(statement as ForStatement);
      case SyntaxKind.BreakStatement:
        return new BSBreakStatement(statement as BreakStatement);
      case SyntaxKind.ContinueStatement:
        return new BSContinueStatement(statement as ContinueStatement);

      // these generate no code.

      case SyntaxKind.TypeAliasDeclaration:
        return new BSTypeAliasDeclaration(statement as TypeAliasDeclaration);
      case SyntaxKind.InterfaceDeclaration:
        return new BSInterfaceDeclaration(statement as InterfaceDeclaration);

      // these are preprocessed in parseSourceFile.

      case SyntaxKind.FunctionDeclaration:
        return new BSFunctionDeclaration(statement as FunctionDeclaration);
      case SyntaxKind.ClassDeclaration:
        return new BSClassDeclaration(statement as ClassDeclaration);
      default:
        throw new Error(`unhandled statement! ${ SyntaxKind[statement.kind] }`);
    }
  }
}

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
