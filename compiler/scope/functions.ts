import { BSMethodDeclaration } from "../parsers/method";
import { BSFunctionDeclaration } from "../parsers/function";
import { Type, SignatureKind, SyntaxKind, FunctionDeclaration, ArrowFunction, MethodDeclaration, SourceFile, TypeFlags, SymbolFlags, Identifier, DeclarationStatement, MethodSignature, SymbolDisplayPartKind, InterfaceDeclaration, ClassDeclaration } from "typescript";
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
import { Constants } from "../constants";
import { isArrayType } from "../parsers/arrayliteral";

export enum Operator {
  TripleEquals = "===",
  NotEquals    = "!==",
  Plus         = "+",
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
  name               : string;

  isGeneric          : boolean;
  typeParamSig       : string[];

  moduleName         : string;

  supportedTypeParams: string[];

  /** 
   * Fully qualified name of the function, e.g. Array__indexOf, that we will
   * refer to this function by in the generated wasm
   */
  getFullyQualifiedName: (typeParam?: string) => string;

  className         : string | null;
  overload          : OperatorOverload | null;
  getTableIndex     : (typeParam?: string) => number;
  signature         : WasmFunctionSignature;

  id: {
    start     : number;
    sourceFile: string;
    name      : string;
  };
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

  private list: Function[];
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
    classType         : Type;
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
      classType,
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

    const signatures = this.scope.typeChecker.getSignaturesOfType(type, SignatureKind.Call);
    if (signatures.length > 1) { throw new Error("Dont support functions with > 1 signature yet."); }
    const signature = signatures[0];
    const isGeneric = signature.typeParameters ? signature.typeParameters.length > 0 : false;
    const supportedTypeParams = isGeneric ? ["string", "number"] : [""];
    const typeParamSig = signature.typeParameters ? signature.typeParameters.map(x => x.symbol.name) : [];
    const id = Functions.TableIndex;

    Functions.TableIndex += supportedTypeParams.length;

    const fn: Function = {
      name                 : methodName,
      getFullyQualifiedName: (typeName = "") => fullyQualifiedName + (typeName === "" ? "" : "__" + typeName),
      supportedTypeParams  ,
      moduleName           : normalizePath(this.scope.sourceFile.fileName),
      className            ,
      overload             ,
      typeParamSig         ,
      getTableIndex        : (typeName = "") => {
        const index = supportedTypeParams.indexOf(typeName);

        if (index === -1) {
          throw new Error(`Cant find type name: ${ typeName }`);
        }

        return id + supportedTypeParams.indexOf(typeName);
      },
      signature            : Functions.GetSignature(this.scope, type),
      isGeneric            ,
      id: {
        start     : type.symbol.valueDeclaration.getStart(),
        sourceFile: type.symbol.valueDeclaration.getSourceFile().fileName,
        name      : methodName,
      },
    };

    this.scope.functions.list.push(fn);

    return fn;
  }

  addFunction(node: BSFunctionDeclaration | BSArrowFunction | BSImportSpecifier): Function {
    let className: string | null = null;
    let fn: Function;

    if (node instanceof BSFunctionDeclaration && !node.name) { throw new Error("Dont support anonymous functions yet."); }

    const signatures = this.scope.typeChecker.getSignaturesOfType(node.tsType, SignatureKind.Call);

    if (signatures.length > 1) { throw new Error("Dont support functions with > 1 signature yet."); }
    const signature = signatures[0];

    const isGeneric     = signature.typeParameters ? signature.typeParameters.length > 0 : false;
    const id            = Functions.TableIndex;
    const wasmSignature = Functions.GetSignature(this.scope, node.tsType);
    const typeParamSig  = signature.typeParameters ? signature.typeParameters.map(x => x.symbol.name) : [];
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

    const supportedTypeParams = isGeneric ? ["string", "number"] : [""];

    Functions.TableIndex += supportedTypeParams.length;

    fn = {
      signature            : wasmSignature,
      moduleName           ,
      name                 ,
      isGeneric            ,
      typeParamSig         ,
      getFullyQualifiedName: (typeName = "") => fullyQualifiedName + (typeName === "" ? "" : "__" + typeName),
      supportedTypeParams  , 
      className            ,
      getTableIndex        : (typeName = "") => id + supportedTypeParams.indexOf(typeName),
      overload             : null,
      id: {
        start     : node.tsType.symbol.valueDeclaration.getStart(),
        sourceFile: node.tsType.symbol.valueDeclaration.getSourceFile().fileName,
        name      : name,
      },
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

    return scope.functions.list;
  }

  getAllNodes(): CompileableFunctionNode[] {
    return this.functionNodes;
  }

  clearAllNodes(): void {
    this.functionNodes = [];
  }

  /** 
   * Attempts to find the Function for the provided type. If we haven't added it
   * yet, then we do so now as well.
   */
  getFunctionByType(type: Type): Function | null {
    /*

    TODO: This is a fairly exhaustive way of getting names of nodes that might come in handy someday.

    let name: string;
    const declaration = type.symbol.valueDeclaration;

    if (type.symbol.valueDeclaration.kind === SyntaxKind.FunctionDeclaration) {
      const fd = declaration as FunctionDeclaration;

      name = fd.name ? fd.name.text : "anonymous_function";
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.MethodDeclaration) {
      const md = declaration as MethodDeclaration;
      const propIdentifier = md.name;

      if (propIdentifier.kind === SyntaxKind.Identifier) {
        const identifier = propIdentifier as Identifier;

        name = identifier.text;
      } else {
        throw new Error("I don't handle methods with weird name types.");
      }
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.DeclareKeyword) {
      const decl = declaration as DeclarationStatement;
      const declIdentifier = decl.name;

      if (declIdentifier && declIdentifier.kind === SyntaxKind.Identifier) {
        const identifier = declIdentifier as Identifier;

        name = identifier.text;
      } else {
        throw new Error("I don't handle declarations with weird name types.");
      }
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.MethodSignature) {
      const md = declaration as MethodSignature;
      const propIdentifier = md.name;

      if (propIdentifier.kind === SyntaxKind.Identifier) {
        const identifier = propIdentifier as Identifier;

        name = identifier.text;
      } else {
        throw new Error("I don't handle methods with weird name types.");
      }
    } else {
      console.log(type.symbol.valueDeclaration.kind);
      console.log(type.symbol.valueDeclaration.getText());

      throw new Error("Couldnt get name of that function.");
    }
    */

    let decl: {
      type      : "normal declaration"
      sourceFile: string;
      start     : number;
    } | {
      type      : "library declaration";
      sourceFile: string;
      fnName    : string;
    };

    decl = {
      type      : "normal declaration",
      sourceFile: type.symbol.valueDeclaration.getSourceFile().fileName,
      start     : type.symbol.valueDeclaration.getStart(),
    };

    /** 
     * TypeScript declarations will lead the definitions of our standard library
     * functions to our library definition file, which, while accurate, is not
     * very helpful for us when we want to get the actual locations of those
     * files. So we rewrite the declaration locations to be in the right place
     * for those functions.
     */
    if (type.symbol.valueDeclaration.getSourceFile().fileName === Constants.LIB_FILE) {
      if (type.symbol.valueDeclaration.kind === SyntaxKind.MethodSignature) {
        /**
         * Get method name.
         */

        const md = type.symbol.valueDeclaration as MethodSignature;
        const propIdentifier = md.name;
        let fnName: string;

        if (propIdentifier.kind === SyntaxKind.Identifier) {
          const identifier = propIdentifier as Identifier;

          fnName = identifier.text;
        } else {
          throw new Error("I don't handle methods with weird name types.");
        }

        /**
         * Get method source file.
         */

        const parent = type.symbol.valueDeclaration.parent;
        let sourceFile: string;

        if (parent.kind === SyntaxKind.InterfaceDeclaration) {
          const interfaceNode = parent as InterfaceDeclaration;

          if (interfaceNode.name.text === "String") {
            sourceFile = Constants.STRING_LIB_FILE;
          } else if (interfaceNode.name.text === "Array") {
            sourceFile = Constants.ARRAY_LIB_FILE;
          } else {
            console.log(type.symbol.valueDeclaration.getText());

            throw new Error("Unhandled library function interface name (expected String or Array).");
          }
        } else {
          throw new Error("Unhandled library function parent type.");
        }

        decl = {
          type      : "library declaration",
          sourceFile,
          fnName    ,
        }
      } else {
        throw new Error("Unhandled library function child type.");
      }
    }

    for (const fn of this.list) {
      if (decl.type === "normal declaration") {
        if (
          fn.id.sourceFile === decl.sourceFile && 
          fn.id.start      === decl.start
        ) {
          return fn;
        }
      } else if (decl.type === "library declaration") {
        if (
          fn.id.sourceFile === decl.sourceFile && 
          fn.id.name       === decl.fnName
        ) {
          return fn;
        }
      }
    }

    console.log(type.symbol.name);
    // console.log(this.list.map(x => x.name));
    console.log(type.symbol.declarations.length);
    console.log(type.symbol.valueDeclaration.getSourceFile().fileName);
    console.log(type.symbol.valueDeclaration.getStart());
    console.log(decl);

    throw new Error("Can't find function for type")
  }

  private getParentTypeOfMethod(type: Type): string {
    if (type.flags & TypeFlags.StringLike) {
      return "StringImpl";
    }

    if (isArrayType(this.scope, type)) {
      return "ArrayImpl";
    }

    const methodDecl = type.symbol.valueDeclaration;
    const parent = methodDecl.parent;

    if (parent.kind === SyntaxKind.ClassDeclaration) {
      const classDecl = parent as ClassDeclaration;

      if (!classDecl.name) { throw new Error("Anonymous classes not supported."); }

      return classDecl.name.text;
    } else {
      throw new Error("couldn't find a class for provided type. it might not be a method.");
    }
  }

  getMethodByOperator(type: Type, operator: Operator): Function {
    const parentName = this.getParentTypeOfMethod(type);

    for (const fn of this.list) {
      if (
        fn.overload &&
        fn.overload.operator === operator &&
        fn.className         === parentName
      ) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${ this.scope.typeChecker.typeToString(type) } and operator name ${operator}`
    );
  }
}