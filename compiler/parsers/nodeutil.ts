import { BSDecorator } from "./decorator";
import { Decorator, Node, SyntaxKind, NodeArray, Block, ParameterDeclaration, Expression, Statement, BinaryExpression, CallExpression, Identifier, NumericLiteral, ConditionalExpression, PostfixUnaryExpression, PrefixUnaryExpression, StringLiteral, AsExpression, ParenthesizedExpression, PropertyAccessExpression, ElementAccessExpression, ThisExpression, ArrayLiteralExpression, ReturnStatement, ExpressionStatement, IfStatement, VariableStatement, ForStatement, BreakStatement, ContinueStatement, TypeAliasDeclaration, InterfaceDeclaration, FunctionDeclaration, ClassDeclaration, BindingName } from "typescript";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSBlock } from "./block";
import { BSParameter } from "./parameter";
import { BSExpression } from "./expression";
import { BSStatement } from "./statement";
import { BSBinaryExpression } from "./binaryexpression";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { BSNumericLiteral } from "./numericliteral";
import { BSConditionalExpression } from "./conditionalexpression";
import { BSPostfixUnaryExpression } from "./postfixunaryexpression";
import { BSPrefixUnaryExpression } from "./prefixunaryexpression";
import { BSTrueKeyword } from "./true";
import { BSFalseKeyword } from "./false";
import { BSStringLiteral } from "./stringliteral";
import { BSAsExpression } from "./as";
import { BSParenthesizedExpression } from "./parentheses";
import { BSPropertyAccessExpression } from "./propertyaccess";
import { BSElementAccessExpression } from "./elementaccess";
import { BSThisKeyword } from "./this";
import { BSArrayLiteral } from "./arrayliteral";
import { BSReturnStatement } from "./return";
import { BSExpressionStatement } from "./expressionstatement";
import { BSIfStatement } from "./if";
import { BSVariableStatement } from "./variablestatement";
import { BSForStatement } from "./for";
import { BSBreakStatement } from "./break";
import { BSContinueStatement } from "./continue";
import { BSTypeAliasDeclaration } from "./typealias";
import { BSInterfaceDeclaration } from "./interface";
import { BSFunctionDeclaration } from "./function";
import { BSClassDeclaration } from "./class";
import { BSBindingName } from "./bindingname";

/**
 * This is where the (typesafe) sausage is made. Avert your eyes!
 *
 * We write a ton of manual overloads so that you can just write buildNode()
 * (or buildNodeArray()) throughout the rest of the code to convert TS nodes
 * into their BS equivalents without having to worry about manually converting
 * them or getting the types right. It should all just work.
 */

 /**
  * Given a TypeScript AST node, returns the BS AST node equivalent.
  */
export function buildNode(ctx: Context, obj: Identifier            ): BSIdentifier;
export function buildNode(ctx: Context, obj: Decorator  | undefined): BSDecorator  | null;
export function buildNode(ctx: Context, obj: BindingName| undefined): BSBindingName| null;
export function buildNode(ctx: Context, obj: BindingName           ): BSBindingName;
export function buildNode(ctx: Context, obj: Block      | undefined): BSBlock      | null;
export function buildNode(ctx: Context, obj: Statement  | undefined): BSStatement  | null;
export function buildNode(ctx: Context, obj: Expression | undefined): BSExpression;
export function buildNode(ctx: Context, obj: Expression            ): BSExpression;

export function buildNode(ctx: Context, obj: Node | undefined): BSNode | null {
  if (obj === undefined) { return null; }

  switch (obj.kind) {
    case SyntaxKind.Decorator               : return new BSDecorator(ctx, obj as Decorator);
    case SyntaxKind.Block                   : return new BSBlock(ctx, obj as Block);
    case SyntaxKind.Parameter               : return new BSParameter(ctx, obj as ParameterDeclaration);
    case SyntaxKind.BinaryExpression        : return new BSBinaryExpression(ctx, obj as BinaryExpression);
    case SyntaxKind.CallExpression          : return new BSCallExpression(ctx, obj as CallExpression);
    case SyntaxKind.Identifier              : return new BSIdentifier(ctx, obj as Identifier);
    case SyntaxKind.NumericLiteral          : return new BSNumericLiteral(ctx, obj as NumericLiteral);
    case SyntaxKind.ConditionalExpression   : return new BSConditionalExpression(ctx, obj as ConditionalExpression);
    case SyntaxKind.PostfixUnaryExpression  : return new BSPostfixUnaryExpression(ctx, obj as PostfixUnaryExpression);
    case SyntaxKind.PrefixUnaryExpression   : return new BSPrefixUnaryExpression(ctx, obj as PrefixUnaryExpression);
    case SyntaxKind.TrueKeyword             : return new BSTrueKeyword(ctx, obj);
    case SyntaxKind.FalseKeyword            : return new BSFalseKeyword(ctx, obj);
    case SyntaxKind.StringLiteral           : return new BSStringLiteral(ctx, obj as StringLiteral);
    case SyntaxKind.AsExpression            : return new BSAsExpression(ctx, obj as AsExpression);
    case SyntaxKind.ParenthesizedExpression : return new BSParenthesizedExpression(ctx, obj as ParenthesizedExpression);
    case SyntaxKind.PropertyAccessExpression: return new BSPropertyAccessExpression(ctx, obj as PropertyAccessExpression);
    case SyntaxKind.ElementAccessExpression : return new BSElementAccessExpression(ctx, obj as ElementAccessExpression);
    case SyntaxKind.ThisKeyword             : return new BSThisKeyword(ctx, obj as ThisExpression);
    case SyntaxKind.ArrayLiteralExpression  : return new BSArrayLiteral(ctx, obj as ArrayLiteralExpression);
    case SyntaxKind.ReturnStatement         : return new BSReturnStatement(ctx, obj as ReturnStatement);
    case SyntaxKind.ExpressionStatement     : return new BSExpressionStatement(ctx, obj as ExpressionStatement);
    case SyntaxKind.ReturnStatement         : return new BSReturnStatement(ctx, obj as ReturnStatement);
    case SyntaxKind.Block                   : return new BSBlock(ctx, obj as Block);
    case SyntaxKind.IfStatement             : return new BSIfStatement(ctx, obj as IfStatement);
    case SyntaxKind.VariableStatement       : return new BSVariableStatement(ctx, obj as VariableStatement);
    case SyntaxKind.ForStatement            : return new BSForStatement(ctx, obj as ForStatement);
    case SyntaxKind.BreakStatement          : return new BSBreakStatement(ctx, obj as BreakStatement);
    case SyntaxKind.ContinueStatement       : return new BSContinueStatement(ctx, obj as ContinueStatement);
    case SyntaxKind.TypeAliasDeclaration    : return new BSTypeAliasDeclaration(ctx, obj as TypeAliasDeclaration);
    case SyntaxKind.InterfaceDeclaration    : return new BSInterfaceDeclaration(ctx, obj as InterfaceDeclaration);
    case SyntaxKind.FunctionDeclaration     : return new BSFunctionDeclaration(ctx, obj as FunctionDeclaration);
    case SyntaxKind.ClassDeclaration        : return new BSClassDeclaration(ctx, obj as ClassDeclaration);
  }

  throw new Error(`Unhandled node in buildNode! ${ SyntaxKind[obj.kind] }`)
}

export function buildNodeArray(ctx: Context, obj: NodeArray<Decorator>            | undefined): BSDecorator[];
export function buildNodeArray(ctx: Context, obj: NodeArray<Statement>            | undefined): BSStatement[];
export function buildNodeArray(ctx: Context, obj: NodeArray<Expression>           | undefined): BSExpression[];
export function buildNodeArray(ctx: Context, obj: NodeArray<ParameterDeclaration> | undefined): BSParameter[];
export function buildNodeArray(ctx: Context, obj: NodeArray<Node>                 | undefined): BSNode[] {
  if (obj === undefined) { return []; }
  if (obj.length === 0) { return []; }

  return obj.map(x => buildNode(ctx, x as any) as any);
}