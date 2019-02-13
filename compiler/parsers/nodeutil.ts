import { BSDecorator } from "./decorator";
import { Decorator, Node, SyntaxKind, NodeArray, Block, ParameterDeclaration, Expression, Statement, BinaryExpression, CallExpression, Identifier, NumericLiteral, ConditionalExpression, PostfixUnaryExpression, PrefixUnaryExpression, StringLiteral, AsExpression, ParenthesizedExpression, PropertyAccessExpression, ElementAccessExpression, ThisExpression, ArrayLiteralExpression, ReturnStatement, ExpressionStatement, IfStatement, VariableStatement, ForStatement, BreakStatement, ContinueStatement, TypeAliasDeclaration, InterfaceDeclaration, FunctionDeclaration, ClassDeclaration, BindingName, VariableDeclaration, PropertyName, ArrowFunction, ImportDeclaration, ImportClause, NamedImports, NamespaceImport, ImportSpecifier, VariableDeclarationList, ObjectLiteralElementLike, ObjectLiteralExpression, PropertyAssignment } from "typescript";
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
import { BSObjectLiteralElementLike, BSObjectLiteralExpression } from "./objectliteralexpression";
import { BSPropertyAssignment } from "./propertyassignment";

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
export function buildNode(scope: Scope, obj: Identifier                                , info?: NodeInfo): BSIdentifier;
export function buildNode(scope: Scope, obj: NamespaceImport                           , info?: NodeInfo): BSNamespaceImport;
export function buildNode(scope: Scope, obj: NamedImports                              , info?: NodeInfo): BSNamedImports;
export function buildNode(scope: Scope, obj: StringLiteral                             , info?: NodeInfo): BSStringLiteral;
export function buildNode(scope: Scope, obj: PropertyName                              , info?: NodeInfo): BSPropertyName;
export function buildNode(scope: Scope, obj: BindingName                               , info?: NodeInfo): BSBindingName;
export function buildNode(scope: Scope, obj: Expression                                , info?: NodeInfo): BSExpression;
export function buildNode(scope: Scope, obj: Decorator  | undefined                    , info?: NodeInfo): BSDecorator  | null;
export function buildNode(scope: Scope, obj: BindingName| undefined                    , info?: NodeInfo): BSBindingName| null;
export function buildNode(scope: Scope, obj: Block      | undefined                    , info?: NodeInfo): BSBlock      | null;
export function buildNode(scope: Scope, obj: Statement  | undefined                    , info?: NodeInfo): BSStatement  | null;
export function buildNode(scope: Scope, obj: Expression | undefined                    , info?: NodeInfo): BSExpression;
export function buildNode(scope: Scope, obj: ImportClause | undefined                  , info?: NodeInfo): BSImportClause | null;
export function buildNode(scope: Scope, obj: NamespaceImport | NamedImports | undefined, info?: NodeInfo): BSNamespaceImport | BSNamedImports | null;
export function buildNode(scope: Scope, obj: VariableDeclarationList | Expression | undefined
                                                                                     , info?: NodeInfo): BSVariableDeclarationList | BSExpression | null;

export function buildNode(scope: Scope, obj: Node | undefined      , info?: NodeInfo): BSNode | null {
  if (obj === undefined) { return null; }

  switch (obj.kind) {
    case SyntaxKind.Decorator               : return new BSDecorator               (scope, obj as Decorator               , info);
    case SyntaxKind.Block                   : return new BSBlock                   (scope, obj as Block                   , info);
    case SyntaxKind.Parameter               : return new BSParameter               (scope, obj as ParameterDeclaration    , info);
    case SyntaxKind.BinaryExpression        : return new BSBinaryExpression        (scope, obj as BinaryExpression        , info);
    case SyntaxKind.CallExpression          : return new BSCallExpression          (scope, obj as CallExpression          , info);
    case SyntaxKind.Identifier              : return new BSIdentifier              (scope, obj as Identifier              , info);
    case SyntaxKind.NumericLiteral          : return new BSNumericLiteral          (scope, obj as NumericLiteral          , info);
    case SyntaxKind.ConditionalExpression   : return new BSConditionalExpression   (scope, obj as ConditionalExpression   , info);
    case SyntaxKind.PostfixUnaryExpression  : return new BSPostfixUnaryExpression  (scope, obj as PostfixUnaryExpression  , info);
    case SyntaxKind.PrefixUnaryExpression   : return new BSPrefixUnaryExpression   (scope, obj as PrefixUnaryExpression   , info);
    case SyntaxKind.TrueKeyword             : return new BSTrueKeyword             (scope, obj                            , info);
    case SyntaxKind.FalseKeyword            : return new BSFalseKeyword            (scope, obj                            , info);
    case SyntaxKind.StringLiteral           : return new BSStringLiteral           (scope, obj as StringLiteral           , info);
    case SyntaxKind.AsExpression            : return new BSAsExpression            (scope, obj as AsExpression            , info);
    case SyntaxKind.ParenthesizedExpression : return new BSParenthesizedExpression (scope, obj as ParenthesizedExpression , info);
    case SyntaxKind.PropertyAccessExpression: return new BSPropertyAccessExpression(scope, obj as PropertyAccessExpression, info);
    case SyntaxKind.ElementAccessExpression : return new BSElementAccessExpression (scope, obj as ElementAccessExpression , info);
    case SyntaxKind.ThisKeyword             : return new BSThisKeyword             (scope, obj as ThisExpression          , info);
    case SyntaxKind.ArrayLiteralExpression  : return new BSArrayLiteral            (scope, obj as ArrayLiteralExpression  , info);
    case SyntaxKind.ReturnStatement         : return new BSReturnStatement         (scope, obj as ReturnStatement         , info);
    case SyntaxKind.ExpressionStatement     : return new BSExpressionStatement     (scope, obj as ExpressionStatement     , info);
    case SyntaxKind.ReturnStatement         : return new BSReturnStatement         (scope, obj as ReturnStatement         , info);
    case SyntaxKind.Block                   : return new BSBlock                   (scope, obj as Block                   , info);
    case SyntaxKind.IfStatement             : return new BSIfStatement             (scope, obj as IfStatement             , info);
    case SyntaxKind.VariableStatement       : return new BSVariableStatement       (scope, obj as VariableStatement       , info);
    case SyntaxKind.ForStatement            : return new BSForStatement            (scope, obj as ForStatement            , info);
    case SyntaxKind.BreakStatement          : return new BSBreakStatement          (scope, obj as BreakStatement          , info);
    case SyntaxKind.ContinueStatement       : return new BSContinueStatement       (scope, obj as ContinueStatement       , info);
    case SyntaxKind.TypeAliasDeclaration    : return new BSTypeAliasDeclaration    (scope, obj as TypeAliasDeclaration    , info);
    case SyntaxKind.InterfaceDeclaration    : return new BSInterfaceDeclaration    (scope, obj as InterfaceDeclaration    , info);
    case SyntaxKind.FunctionDeclaration     : return new BSFunctionDeclaration     (scope, obj as FunctionDeclaration     , info);
    case SyntaxKind.ClassDeclaration        : return new BSClassDeclaration        (scope, obj as ClassDeclaration        , info);
    case SyntaxKind.VariableDeclaration     : return new BSVariableDeclaration     (scope, obj as VariableDeclaration     , info);
    case SyntaxKind.ArrowFunction           : return new BSArrowFunction           (scope, obj as ArrowFunction           , info);
    case SyntaxKind.ImportDeclaration       : return new BSImportDeclaration       (scope, obj as ImportDeclaration       , info);
    case SyntaxKind.ImportClause            : return new BSImportClause            (scope, obj as ImportClause            , info);
    case SyntaxKind.ImportSpecifier         : return new BSImportSpecifier         (scope, obj as ImportSpecifier         , info);
    case SyntaxKind.NamedImports            : return new BSNamedImports            (scope, obj as NamedImports            , info);
    case SyntaxKind.VariableDeclarationList : return new BSVariableDeclarationList (scope, obj as VariableDeclarationList , info);
    case SyntaxKind.ObjectLiteralExpression : return new BSObjectLiteralExpression (scope, obj as ObjectLiteralExpression , info);
    case SyntaxKind.PropertyAssignment      : return new BSPropertyAssignment      (scope, obj as PropertyAssignment      , info);
  }

  throw new Error(`Unhandled node in buildNode! ${ SyntaxKind[obj.kind] }`)
}

export function buildNodeArray(scope: Scope, obj: NodeArray<ObjectLiteralElementLike> | undefined, info?: NodeInfo): BSObjectLiteralElementLike[];
export function buildNodeArray(scope: Scope, obj: NodeArray<Decorator>                | undefined, info?: NodeInfo): BSDecorator[];
export function buildNodeArray(scope: Scope, obj: NodeArray<ImportSpecifier>          | undefined, info?: NodeInfo): BSImportSpecifier[];
export function buildNodeArray(scope: Scope, obj: NodeArray<VariableDeclaration>      | undefined, info?: NodeInfo): BSVariableDeclaration[];
export function buildNodeArray(scope: Scope, obj: NodeArray<Statement>                | undefined, info?: NodeInfo): BSStatement[];
export function buildNodeArray(scope: Scope, obj: NodeArray<Expression>               | undefined, info?: NodeInfo): BSExpression[];
export function buildNodeArray(scope: Scope, obj: NodeArray<ParameterDeclaration>     | undefined, info?: NodeInfo): BSParameter[];
export function buildNodeArray(scope: Scope, obj: NodeArray<Node>                     | undefined, info?: NodeInfo): BSNode[] {
  if (obj === undefined) { return []; }
  if (obj.length === 0) { return []; }

  const result: any[] = [];

  for (const x of obj) {
    result.push(buildNode(scope, x as any, info));
  }

  return result as any;
  //return obj.map(x => buildNode(scope, x as any) as any);
}