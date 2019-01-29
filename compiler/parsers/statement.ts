import { Context } from "../context";
import {
  Statement,
  SyntaxKind,
  ExpressionStatement,
  ReturnStatement,
  FunctionDeclaration,
  Block,
  IfStatement,
  VariableStatement,
  ForStatement,
  BreakStatement,
  ContinueStatement,
  ClassDeclaration,
  TypeAliasDeclaration,
  InterfaceDeclaration,
} from "typescript";
import { Sexpr } from "../sexpr";
import { BSExpressionStatement } from "./expressionstatement";
import { BSReturnStatement } from "./return";
import { BSBlock } from "./block";
import { BSIfStatement } from "./if";
import {
  BSVariableStatement
} from "./variablestatement";
import { BSForStatement } from "./for";
import { BSBreakStatement } from "./break";
import { BSContinueStatement } from "./continue";
import { BSTypeAliasDeclaration } from "./typealias";
import { BSInterfaceDeclaration } from "./interface";
import { BSFunctionDeclaration } from "./function";
import { BSClassDeclaration } from "./class";
import { BSNode } from "./bsnode";

export class BSStatement extends BSNode {
  children: BSNode[];
  readonly type = "Statement";

  statement : BSNode;
  nodeREMOVE: Statement;

  constructor(ctx: Context, statement: Statement) {
    super(ctx, statement);

    this.statement = this.getStatement(ctx, statement);
    this.children = [this.statement];

    this.nodeREMOVE = statement;
  }

  getStatement(ctx: Context, statement: Statement): BSNode {
    switch (statement.kind) {
      case SyntaxKind.ExpressionStatement:
        return new BSExpressionStatement(ctx, statement as ExpressionStatement);
      case SyntaxKind.ReturnStatement:
        return new BSReturnStatement(ctx, statement as ReturnStatement);
      case SyntaxKind.Block:
        return new BSBlock(ctx, statement as Block);
      case SyntaxKind.IfStatement:
        return new BSIfStatement(ctx, statement as IfStatement);
      case SyntaxKind.VariableStatement:
        return new BSVariableStatement(ctx, statement as VariableStatement);
      case SyntaxKind.ForStatement:
        return new BSForStatement(ctx, statement as ForStatement);
      case SyntaxKind.BreakStatement:
        return new BSBreakStatement(ctx, statement as BreakStatement);
      case SyntaxKind.ContinueStatement:
        return new BSContinueStatement(ctx, statement as ContinueStatement);

      // these generate no code.

      case SyntaxKind.TypeAliasDeclaration:
        return new BSTypeAliasDeclaration(
          ctx,
          statement as TypeAliasDeclaration
        );
      case SyntaxKind.InterfaceDeclaration:
        return new BSInterfaceDeclaration(
          ctx,
          statement as InterfaceDeclaration
        );

      // these are preprocessed in parseSourceFile.

      case SyntaxKind.FunctionDeclaration:
        return new BSFunctionDeclaration(ctx, statement as FunctionDeclaration);
      case SyntaxKind.ClassDeclaration:
        return new BSClassDeclaration(ctx, statement as ClassDeclaration);
      default:
        throw new Error(`unhandled statement! ${SyntaxKind[statement.kind]}`);
    }
  }

  compile(ctx: Context): Sexpr | null {
    return parseStatement(ctx, this.nodeREMOVE);
  }
}

export function parseStatement(
  ctx: Context,
  statement: Statement
): Sexpr | null {
  switch (statement.kind) {
    case SyntaxKind.ExpressionStatement:
      return new BSExpressionStatement(ctx, statement as ExpressionStatement).compile(ctx);
    case SyntaxKind.ReturnStatement:
      return new BSReturnStatement(ctx, statement as ReturnStatement).compile(ctx);
    case SyntaxKind.Block:
      return new BSBlock(ctx, statement as Block).compile(ctx);
    case SyntaxKind.IfStatement:
      return new BSIfStatement(ctx, statement as IfStatement).compile(ctx);
    case SyntaxKind.VariableStatement:
      return new BSVariableStatement(ctx, statement as VariableStatement).compile(ctx);
    case SyntaxKind.ForStatement:
      return new BSForStatement(ctx, statement as ForStatement).compile(ctx);
    case SyntaxKind.BreakStatement:
      return new BSBreakStatement(ctx, statement as BreakStatement).compile(ctx);
    case SyntaxKind.ContinueStatement:
      return new BSContinueStatement(ctx, statement as ContinueStatement).compile(ctx);

    // these generate no code.

    case SyntaxKind.TypeAliasDeclaration: return null;
    case SyntaxKind.InterfaceDeclaration: return null;

    // these are preprocessed in parseSourceFile.

    case SyntaxKind.FunctionDeclaration: return null;
    case SyntaxKind.ClassDeclaration: return null;

    default:
      throw new Error(`unhandled statement! ${SyntaxKind[statement.kind]}`);
  }
}
