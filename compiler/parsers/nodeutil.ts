import { BSDecorator } from "./decorator";
import { Decorator, Node, SyntaxKind, NodeArray, Block, ParameterDeclaration, Expression, Statement, BinaryExpression, CallExpression, Identifier, NumericLiteral, ConditionalExpression, PostfixUnaryExpression, PrefixUnaryExpression, StringLiteral, AsExpression, ParenthesizedExpression, PropertyAccessExpression, ElementAccessExpression, ThisExpression, ArrayLiteralExpression, ReturnStatement, ExpressionStatement, IfStatement, VariableStatement, ForStatement, BreakStatement, ContinueStatement, TypeAliasDeclaration, InterfaceDeclaration, FunctionDeclaration, ClassDeclaration, BindingName, VariableDeclaration, PropertyName, ArrowFunction, ImportDeclaration, ImportClause, NamedImports, NamespaceImport, ImportSpecifier, VariableDeclarationList } from "typescript";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo } from "./bsnode";
import { BSBlock } from "./block";
import { BSParameter } from "./parameter";
import { BSExpression, BSPropertyName, BSBindingName } from "./expression";
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
import { BSVariableDeclaration } from "./variabledeclaration";
import { BSArrowFunction } from "./arrowfunction";
import { BSImportDeclaration } from "./importdeclaration";
import { BSImportClause } from "./importclause";
import { BSNamedImports } from "./namedimports";
import { BSNamespaceImport } from "./namespaceimport";
import { BSImportSpecifier } from "./importspecifier";
import { BSVariableDeclarationList } from "./variabledeclarationlist";

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
export function buildNode(ctx: Scope, obj: ImportClause | undefined                  , info?: NodeInfo): BSImportClause | null;
export function buildNode(ctx: Scope, obj: VariableDeclarationList | Expression | undefined
                                                                                     , info?: NodeInfo): BSVariableDeclarationList | BSExpression | null;
export function buildNode(ctx: Scope, obj: Identifier                                , info?: NodeInfo): BSIdentifier;
export function buildNode(ctx: Scope, obj: NamespaceImport                           , info?: NodeInfo): BSNamespaceImport;
export function buildNode(ctx: Scope, obj: NamedImports                              , info?: NodeInfo): BSNamedImports;
export function buildNode(ctx: Scope, obj: StringLiteral                             , info?: NodeInfo): BSStringLiteral;
export function buildNode(ctx: Scope, obj: PropertyName                              , info?: NodeInfo): BSPropertyName;
export function buildNode(ctx: Scope, obj: NamespaceImport | NamedImports | undefined, info?: NodeInfo): BSNamespaceImport | BSNamedImports | null;
export function buildNode(ctx: Scope, obj: Decorator  | undefined                    , info?: NodeInfo): BSDecorator  | null;
export function buildNode(ctx: Scope, obj: BindingName                               , info?: NodeInfo): BSBindingName;
export function buildNode(ctx: Scope, obj: BindingName| undefined                    , info?: NodeInfo): BSBindingName| null;
export function buildNode(ctx: Scope, obj: Block      | undefined                    , info?: NodeInfo): BSBlock      | null;
export function buildNode(ctx: Scope, obj: Statement  | undefined                    , info?: NodeInfo): BSStatement  | null;
export function buildNode(ctx: Scope, obj: Expression | undefined                    , info?: NodeInfo): BSExpression;
export function buildNode(ctx: Scope, obj: Expression                                , info?: NodeInfo): BSExpression;

export function buildNode(ctx: Scope, obj: Node | undefined      , info?: NodeInfo): BSNode | null {
  if (obj === undefined) { return null; }

  switch (obj.kind) {
    case SyntaxKind.Decorator               : return new BSDecorator               (ctx, obj as Decorator               , info);
    case SyntaxKind.Block                   : return new BSBlock                   (ctx, obj as Block                   , info);
    case SyntaxKind.Parameter               : return new BSParameter               (ctx, obj as ParameterDeclaration    , info);
    case SyntaxKind.BinaryExpression        : return new BSBinaryExpression        (ctx, obj as BinaryExpression        , info);
    case SyntaxKind.CallExpression          : return new BSCallExpression          (ctx, obj as CallExpression          , info);
    case SyntaxKind.Identifier              : return new BSIdentifier              (ctx, obj as Identifier              , info);
    case SyntaxKind.NumericLiteral          : return new BSNumericLiteral          (ctx, obj as NumericLiteral          , info);
    case SyntaxKind.ConditionalExpression   : return new BSConditionalExpression   (ctx, obj as ConditionalExpression   , info);
    case SyntaxKind.PostfixUnaryExpression  : return new BSPostfixUnaryExpression  (ctx, obj as PostfixUnaryExpression  , info);
    case SyntaxKind.PrefixUnaryExpression   : return new BSPrefixUnaryExpression   (ctx, obj as PrefixUnaryExpression   , info);
    case SyntaxKind.TrueKeyword             : return new BSTrueKeyword             (ctx, obj                            , info);
    case SyntaxKind.FalseKeyword            : return new BSFalseKeyword            (ctx, obj                            , info);
    case SyntaxKind.StringLiteral           : return new BSStringLiteral           (ctx, obj as StringLiteral           , info);
    case SyntaxKind.AsExpression            : return new BSAsExpression            (ctx, obj as AsExpression            , info);
    case SyntaxKind.ParenthesizedExpression : return new BSParenthesizedExpression (ctx, obj as ParenthesizedExpression , info);
    case SyntaxKind.PropertyAccessExpression: return new BSPropertyAccessExpression(ctx, obj as PropertyAccessExpression, info);
    case SyntaxKind.ElementAccessExpression : return new BSElementAccessExpression (ctx, obj as ElementAccessExpression , info);
    case SyntaxKind.ThisKeyword             : return new BSThisKeyword             (ctx, obj as ThisExpression          , info);
    case SyntaxKind.ArrayLiteralExpression  : return new BSArrayLiteral            (ctx, obj as ArrayLiteralExpression  , info);
    case SyntaxKind.ReturnStatement         : return new BSReturnStatement         (ctx, obj as ReturnStatement         , info);
    case SyntaxKind.ExpressionStatement     : return new BSExpressionStatement     (ctx, obj as ExpressionStatement     , info);
    case SyntaxKind.ReturnStatement         : return new BSReturnStatement         (ctx, obj as ReturnStatement         , info);
    case SyntaxKind.Block                   : return new BSBlock                   (ctx, obj as Block                   , info);
    case SyntaxKind.IfStatement             : return new BSIfStatement             (ctx, obj as IfStatement             , info);
    case SyntaxKind.VariableStatement       : return new BSVariableStatement       (ctx, obj as VariableStatement       , info);
    case SyntaxKind.ForStatement            : return new BSForStatement            (ctx, obj as ForStatement            , info);
    case SyntaxKind.BreakStatement          : return new BSBreakStatement          (ctx, obj as BreakStatement          , info);
    case SyntaxKind.ContinueStatement       : return new BSContinueStatement       (ctx, obj as ContinueStatement       , info);
    case SyntaxKind.TypeAliasDeclaration    : return new BSTypeAliasDeclaration    (ctx, obj as TypeAliasDeclaration    , info);
    case SyntaxKind.InterfaceDeclaration    : return new BSInterfaceDeclaration    (ctx, obj as InterfaceDeclaration    , info);
    case SyntaxKind.FunctionDeclaration     : return new BSFunctionDeclaration     (ctx, obj as FunctionDeclaration     , info);
    case SyntaxKind.ClassDeclaration        : return new BSClassDeclaration        (ctx, obj as ClassDeclaration        , info);
    case SyntaxKind.VariableDeclaration     : return new BSVariableDeclaration     (ctx, obj as VariableDeclaration     , info);
    case SyntaxKind.ArrowFunction           : return new BSArrowFunction           (ctx, obj as ArrowFunction           , info);
    case SyntaxKind.ImportDeclaration       : return new BSImportDeclaration       (ctx, obj as ImportDeclaration       , info);
    case SyntaxKind.ImportClause            : return new BSImportClause            (ctx, obj as ImportClause            , info);
    case SyntaxKind.ImportSpecifier         : return new BSImportSpecifier         (ctx, obj as ImportSpecifier         , info);
    case SyntaxKind.NamedImports            : return new BSNamedImports            (ctx, obj as NamedImports            , info);
    case SyntaxKind.VariableDeclarationList : return new BSVariableDeclarationList (ctx, obj as VariableDeclarationList , info);
  }

  throw new Error(`Unhandled node in buildNode! ${ SyntaxKind[obj.kind] }`)
}

export function buildNodeArray(ctx: Scope, obj: NodeArray<Decorator>            | undefined, info?: NodeInfo): BSDecorator[];
export function buildNodeArray(ctx: Scope, obj: NodeArray<ImportSpecifier>      | undefined, info?: NodeInfo): BSImportSpecifier[];
export function buildNodeArray(ctx: Scope, obj: NodeArray<VariableDeclaration>  | undefined, info?: NodeInfo): BSVariableDeclaration[];
export function buildNodeArray(ctx: Scope, obj: NodeArray<Statement>            | undefined, info?: NodeInfo): BSStatement[];
export function buildNodeArray(ctx: Scope, obj: NodeArray<Expression>           | undefined, info?: NodeInfo): BSExpression[];
export function buildNodeArray(ctx: Scope, obj: NodeArray<ParameterDeclaration> | undefined, info?: NodeInfo): BSParameter[];
export function buildNodeArray(ctx: Scope, obj: NodeArray<Node>                 | undefined, info?: NodeInfo): BSNode[] {
  if (obj === undefined) { return []; }
  if (obj.length === 0) { return []; }

  const result: any[] = [];

  for (const x of obj) {
    result.push(buildNode(ctx, x as any, info));
  }

  return result as any;
  //return obj.map(x => buildNode(ctx, x as any) as any);
}