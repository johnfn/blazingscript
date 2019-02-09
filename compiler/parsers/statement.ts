import { Scope } from "../scope/scope";
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
import { BSVariableStatement } from "./variablestatement";
import { BSForStatement } from "./for";
import { BSBreakStatement } from "./break";
import { BSContinueStatement } from "./continue";
import { BSTypeAliasDeclaration } from "./typealias";
import { BSInterfaceDeclaration } from "./interface";
import { BSFunctionDeclaration } from "./function";
import { BSClassDeclaration } from "./class";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

export class BSStatement extends BSNode {
  children: BSNode[];
  statement : BSNode;

  constructor(ctx: Scope, statement: Statement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, statement);

    this.statement = this.getStatement(ctx, statement);
    this.children = [this.statement];
  }

  getStatement(ctx: Scope, statement: Statement): BSNode {
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
      case SyntaxKind.TypeAliasDeclaration:
        return new BSTypeAliasDeclaration(ctx, statement as TypeAliasDeclaration);
      case SyntaxKind.InterfaceDeclaration:
        return new BSInterfaceDeclaration(ctx, statement as InterfaceDeclaration);
      case SyntaxKind.FunctionDeclaration:
        return new BSFunctionDeclaration(ctx, statement as FunctionDeclaration);
      case SyntaxKind.ClassDeclaration:
        return new BSClassDeclaration(ctx, statement as ClassDeclaration);
      default:
        throw new Error(`unhandled statement! ${SyntaxKind[statement.kind]}`);
    }
  }

  compile(ctx: Scope): Sexpr | null {
    return this.statement.compile(ctx);
  }
}
