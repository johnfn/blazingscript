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
import { Sexpr, S } from "../sexpr";
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

  constructor(scope: Scope, statement: Statement, info: NodeInfo = defaultNodeInfo) {
    super(scope, statement);

    this.statement = this.getStatement(scope, statement);
    this.children = [this.statement];
  }

  getStatement(scope: Scope, statement: Statement): BSNode {
    switch (statement.kind) {
      case SyntaxKind.ExpressionStatement:
        return new BSExpressionStatement(scope, statement as ExpressionStatement);
      case SyntaxKind.ReturnStatement:
        return new BSReturnStatement(scope, statement as ReturnStatement);
      case SyntaxKind.Block:
        return new BSBlock(scope, statement as Block);
      case SyntaxKind.IfStatement:
        return new BSIfStatement(scope, statement as IfStatement);
      case SyntaxKind.VariableStatement:
        return new BSVariableStatement(scope, statement as VariableStatement);
      case SyntaxKind.ForStatement:
        return new BSForStatement(scope, statement as ForStatement);
      case SyntaxKind.BreakStatement:
        return new BSBreakStatement(scope, statement as BreakStatement);
      case SyntaxKind.ContinueStatement:
        return new BSContinueStatement(scope, statement as ContinueStatement);
      case SyntaxKind.TypeAliasDeclaration:
        return new BSTypeAliasDeclaration(scope, statement as TypeAliasDeclaration);
      case SyntaxKind.InterfaceDeclaration:
        return new BSInterfaceDeclaration(scope, statement as InterfaceDeclaration);
      case SyntaxKind.FunctionDeclaration:
        return new BSFunctionDeclaration(scope, statement as FunctionDeclaration);
      case SyntaxKind.ClassDeclaration:
        return new BSClassDeclaration(scope, statement as ClassDeclaration);
      default:
        throw new Error(`unhandled statement! ${SyntaxKind[statement.kind]}`);
    }
  }

  compile(scope: Scope): Sexpr | null {
    const res = this.statement.compile(scope);

    if (Array.isArray(res)) {
      return S.Block(res);
    } else {
      return res;
    }
  }
}
