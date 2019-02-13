import { BSMethodDeclaration } from "../parsers/method";
import { BSFunctionDeclaration } from "../parsers/function";
import { Type, idText, TypeFlags, SignatureKind, Signature, SyntaxKind, FunctionDeclaration, ArrowFunction, MethodDeclaration } from "typescript";
import { BSExpression } from "../parsers/expression";
import { Sexpr, S, WasmType } from "../sexpr";
import { parseStatementListBS } from "../parsers/statementlist";
import { BSNode } from "../parsers/bsnode";
import { Scope } from "./scope";
import { BSIdentifier } from "../parsers/identifier";
import { BSCallExpression } from "../parsers/callexpression";
import { BSPropertyAccessExpression } from "../parsers/propertyaccess";
import { BSArrowFunction } from "../parsers/arrowfunction";
import { assertNever, normalizeString as normalizePath } from "../util";
import { BSImportSpecifier } from "../parsers/importspecifier";

export enum Operator {
  TripleEquals = "===",
  NotEquals    = "!==",
  Add          = "+",
  ArrayIndex   = "[]",
};

export type OperatorOverload = {
  operator: Operator;
};

export const TsTypeToWasmType = (type: Type): WasmType => {
  return "i32";
}

export type WasmFunctionSignature = {
  parameters: WasmType[];
  return    : WasmType;
  name      : string;
}

// TODO should probably rename this as to not clash with Function the js type
export type Function = {
  /**
   * Name of the function, e.g. indexOf
   */
  name              : string;

  moduleName        : string;

  /**
   * Fully qualified name of the function, e.g. Array__indexOf
   */
  fullyQualifiedName: string;

  className         : string | null;
  overload          : OperatorOverload | null;
  tableIndex        : number;
  signature         : WasmFunctionSignature;
};

export type CompileableFunctionNode =
  | BSMethodDeclaration
  | BSFunctionDeclaration
  | BSArrowFunction

export class Functions {
  private static TableIndex = 0;

  /**
   * These are used for building the function table.
   */
  public static AllSignatures: { [key: string]: WasmFunctionSignature } = {};

  list: Function[];
  functionNodes: (BSMethodDeclaration | BSFunctionDeclaration | BSArrowFunction)[];
  scope: Scope;

  constructor(scope: Scope) {
    this.list          = [];
    this.functionNodes = [];
    this.scope         = scope;
  }

  static GetCallExpressionSignature(node: BSCallExpression): WasmFunctionSignature {
    let params: WasmType[];

    params = node.arguments.map(arg => TsTypeToWasmType(arg.tsType));

    if (node.expression instanceof BSPropertyAccessExpression) {
      // Need to add implicit this argument!

      params = ["i32", ...params];
    }

    const ret    = TsTypeToWasmType(node.tsType);
    const name   = "$" + params.join("_") + "__ret_" + ret;

    if (!Functions.AllSignatures[name]) {
      const sig    : WasmFunctionSignature = {
        parameters: params,
        return    : ret,
        name      : name,
      };

      Functions.AllSignatures[name] = sig;
    }

    return Functions.AllSignatures[name];
  }

  static GetSignature(scope: Scope, type: Type): WasmFunctionSignature {
    const sigs = scope.typeChecker.getSignaturesOfType(type, SignatureKind.Call);
    const sig  = sigs[0];
    let params: WasmType[] = [];

    if (sigs.length > 1) {
      throw new Error("Do not handle functions with > 1 signature yet!");
    }

    if (sig.declaration && sig.declaration.kind === SyntaxKind.FunctionDeclaration) {
      const decl = sig.declaration as FunctionDeclaration;
      for (const p of decl.parameters) {
        const type = scope.typeChecker.getTypeAtLocation(p);

        params.push(TsTypeToWasmType(type));
      }
    }

    if (sig.declaration && sig.declaration.kind === SyntaxKind.ArrowFunction) {
      const decl = sig.declaration as ArrowFunction;
      for (const p of decl.parameters) {
        const type = scope.typeChecker.getTypeAtLocation(p);

        params.push(TsTypeToWasmType(type));
      }
    }

    if (sig.declaration && sig.declaration.kind === SyntaxKind.MethodDeclaration) {
      const decl = sig.declaration as MethodDeclaration;

      // Need to add implicit this argument!
      params.push("i32");

      for (const p of decl.parameters) {
        const type = scope.typeChecker.getTypeAtLocation(p);

        params.push(TsTypeToWasmType(type));
      }
    }

    const ret  = TsTypeToWasmType(sig.getReturnType());
    const name = "$" + params.join("_") + "__ret_" + ret;

    if (!Functions.AllSignatures[name]) {
      const sig    : WasmFunctionSignature = {
        parameters: params,
        return    : ret,
        name      : name,
      };

      Functions.AllSignatures[name] = sig;
    }

    return Functions.AllSignatures[name];
  }

  public static GetMethodTypeInfo(scope: Scope, type: Type): {
    className         : string;
    methodName        : string;
    fullyQualifiedName: string;
  } {
    const methodName = scope.typeChecker.symbolToString(type.symbol);
    const sig = scope.typeChecker.getSignaturesOfType(type, SignatureKind.Call);

    if (sig.length > 1) { throw new Error("Dont handle methods with multiple signatures!"); }
    if (sig.length === 0) { throw new Error("Method declaration could not find signature."); }

    const classDecl = (sig[0].declaration as MethodDeclaration).parent;
    const classType = scope.typeChecker.getTypeAtLocation(classDecl);
    const className = scope.typeChecker.symbolToString(classType.symbol);

    if (!methodName) { throw new Error("anonymous methods not supported yet!"); }
    if (!className) { throw new Error("anonymous classes not supported yet!"); }

    return {
      className,
      methodName,
      fullyQualifiedName: `${ className }__${ methodName }`,
    };
  }

  addCompiledFunctionNode(node: BSMethodDeclaration | BSFunctionDeclaration | BSArrowFunction): void {
    this.scope.topmostScope().functions.functionNodes.push(node);
  }

  addMethod(props: {
    type    : Type;
    overload: OperatorOverload | null;
  }): Function {
    const { type, overload } = props;
    const {
      className,
      methodName,
      fullyQualifiedName,
    } = Functions.GetMethodTypeInfo(this.scope, type);

    /** 
     * If we've already seen this function in a different file, don't add it
     * again.
     */
    for (const fn of this.getAll(this.scope.topmostScope())) {
      if (fn.name === methodName && fn.className === className) { // TODO: Check module name too.
        return fn;
      }
    }

    const fn: Function = {
      name              : methodName,
      fullyQualifiedName,
      moduleName        : normalizePath(this.scope.sourceFile.fileName),
      className         ,
      overload          ,
      tableIndex        : Functions.TableIndex++,
      signature         : Functions.GetSignature(this.scope, type),
    };

    this.scope.functions.list.push(fn);

    return fn;
  }

  addFunction(node: BSFunctionDeclaration | BSArrowFunction | BSImportSpecifier): Function {
    let className: string | null = null;
    let fn: Function;

    if (node instanceof BSFunctionDeclaration && !node.name) { throw new Error("Dont support anonymous functions yet."); }

    const id         = Functions.TableIndex++;
    const signature  = Functions.GetSignature(this.scope, node.tsType);
    let name              : string;
    let fullyQualifiedName: string;
    let moduleName        : string;

    if (node instanceof BSFunctionDeclaration) {
      name               = node.name!; // i checked this above.
      fullyQualifiedName = normalizePath(this.scope.sourceFile.fileName) + "__" + node.name;
      moduleName         = normalizePath(this.scope.sourceFile.fileName);
    } else if (node instanceof BSArrowFunction) {
      name               = `arrow_${ id }`;
      fullyQualifiedName = name;
      moduleName         = normalizePath(this.scope.sourceFile.fileName);
    } else if (node instanceof BSImportSpecifier) {
      name               = node.name.text;
      moduleName         = normalizePath(node.moduleName);
      fullyQualifiedName = normalizePath(moduleName) + "__" + name;
    } else {
      return assertNever(node);
    }

    fn = {
      signature         ,
      moduleName        ,
      name              ,
      fullyQualifiedName,
      className         ,
      tableIndex        : id,
      overload          : null,
    };

    this.list.push(fn);

    return fn;
  }

  count(): number {
    return this.list.length;
  }

  toString(): string {
    return this.list.map(x => x.name).join(", ");
  }

  getAll(scope: Scope | null = null): Function[] {
    if (scope === null) { scope = this.scope; }

    const scopes = this.scope.getAllScopes(scope);
    const functions = ([] as Function[]).concat(...scopes.map(x => x.functions.list));

    return functions;
  }

  getAllNodes(): CompileableFunctionNode[] {
    return this.functionNodes;
  }

  clearAllNodes(): void {
    this.functionNodes = [];
  }

  callMethodByOperator(props: {
    type     : Type;
    opName   : Operator;
    thisExpr : BSExpression;
    argExprs : BSNode[];
  }): Sexpr {
    const { type, thisExpr: thisNode, opName, argExprs } = props;

    const fn       = this.getMethodByOperator(type, opName);
    const thisExpr = thisNode.compile(this.scope);

    if (!thisExpr) {
      throw new Error("wanted nonnull");
    }

    return S(
      "i32",
      "call",
      "$" + fn.fullyQualifiedName,
      thisExpr,
      ...parseStatementListBS(this.scope, argExprs)
    );
  }

  getFunctionByName(name: string): Function | null {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions.list) {
        if (fn.name === name) {
          return fn;
        }
      }

      currScope = currScope.parent;
    }

    return null;
  }

  getFunctionByIdentifier(identifier: BSIdentifier): Function {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions.list) {
        if (fn.name === identifier.text) {
          return fn;
        }
      }

      currScope = currScope.parent;
    }

    throw new Error(`Can't find function ${ identifier.text }`);
  }

  getMethodByName(type: Type, methodName: string): Function {
    const cls = this.scope.getScopeForClass(type);

    if (cls === null) {
      throw new Error(`Cant find appropriate method`);
    }

    for (const fn of cls.functions.list) {
      if (fn.name === methodName) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${ this.scope.typeChecker.typeToString(type) } and method name ${ methodName }`
    );
  }

  getMethodByOperator(type: Type, operator: Operator): Function {
    const cls = this.scope.getScopeForClass(type);

    if (cls === null) {
      throw new Error(`Cant find appropriate method by operator`);
    }

    const functions = cls.functions.list;

    for (const fn of functions) {
      if (
        fn.overload &&
        fn.overload.operator === operator
      ) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${ this.scope.typeChecker.typeToString(type) } and operator name ${operator}`
    );
  }
}