import { BSMethodDeclaration } from "../parsers/method";
import { BSFunctionDeclaration } from "../parsers/function";
import { Type, SignatureKind, SyntaxKind, FunctionDeclaration, ArrowFunction, MethodDeclaration, SourceFile, TypeFlags, SymbolFlags, Identifier, DeclarationStatement, MethodSignature, SymbolDisplayPartKind, InterfaceDeclaration, ClassDeclaration, ImportSpecifier, ImportDeclaration, StringLiteral, Declaration, TypeChecker } from "typescript";
import { Sexpr, S, WasmType } from "../sexpr";
import { Scope, ScopeName } from "./scope";
import { BSCallExpression } from "../parsers/callexpression";
import { BSPropertyAccessExpression } from "../parsers/propertyaccess";
import { BSArrowFunction } from "../parsers/arrowfunction";
import { assertNever, normalizeString as normalizePath } from "../util";
import { Constants } from "../constants";
import { isArrayType } from "../parsers/arrayliteral";
import { BSClassDeclaration } from "../parsers/class";
import { NativeClasses } from "../program";
import { FunctionId } from "./functionid";

/**
 * Note: Written this way so we can do an easy `in` check.
 */
export enum Operator {
  "===" = "===",
  "!==" = "!==",
  "+"   = "+"  ,
  "[]"  = "[]" ,
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
  isGeneric          : boolean;
  typeParamSig       : string[];

  supportedTypeParams: string[];

  /** 
   * Fully qualified name of the function, e.g. Array__indexOf, that we will
   * refer to this function by in the generated wasm
   */
  getFullyQualifiedName: (typeParam?: string) => string;

  getTableIndex     : (typeParam?: string) => number;
  signature         : WasmFunctionSignature;

  className         : string | null;
  overload          : Operator | null;
  id                : FunctionId;
};

export class Functions {
  private static TableIndex = 0;

  /**
   * These are used for building the function table.
   */
  public static AllSignatures: { [key: string]: WasmFunctionSignature } = {};

  private list: Function[];
  functionExprs: Sexpr[][];
  checker      : TypeChecker;
  private nativeClasses: NativeClasses;

  /** TODO: Remove this. */
  activeScope!: Scope;

  constructor(checker: TypeChecker, nativeClasses: NativeClasses) {
    this.list          = [];
    this.functionExprs = [];
    this.checker       = checker;
    this.nativeClasses = nativeClasses;
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

  static GetSignature(checker: TypeChecker, type: Type): WasmFunctionSignature {
    const sigs = checker.getSignaturesOfType(type, SignatureKind.Call);
    const sig  = sigs[0];
    let params : WasmType[] = [];

    if (sigs.length > 1) {
      throw new Error("Do not handle functions with > 1 signature yet!");
    }

    if (sig.declaration && sig.declaration.kind === SyntaxKind.FunctionDeclaration) {
      const decl = sig.declaration as FunctionDeclaration;
      for (const p of decl.parameters) {
        const type = checker.getTypeAtLocation(p);

        params.push(TsTypeToWasmType(type));
      }
    }

    if (sig.declaration && sig.declaration.kind === SyntaxKind.ArrowFunction) {
      const decl = sig.declaration as ArrowFunction;
      for (const p of decl.parameters) {
        const type = checker.getTypeAtLocation(p);

        params.push(TsTypeToWasmType(type));
      }
    }

    if (sig.declaration && sig.declaration.kind === SyntaxKind.MethodDeclaration) {
      const decl = sig.declaration as MethodDeclaration;

      // Need to add implicit this argument!
      params.push("i32");

      for (const p of decl.parameters) {
        const type = checker.getTypeAtLocation(p);

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

  private getMethodTypeInfo(checker: TypeChecker, type: Type): {
    className         : string;
    methodName        : string;
    fullyQualifiedName: string;
    classType         : Type;
  } {
    const methodName = checker.symbolToString(type.symbol);
    const sig = checker.getSignaturesOfType(type, SignatureKind.Call);

    if (sig.length > 1) { throw new Error("Dont handle methods with multiple signatures!"); }
    if (sig.length === 0) { throw new Error("Method declaration could not find signature."); }

    const classDecl = (sig[0].declaration as MethodDeclaration).parent;
    const classType = checker.getTypeAtLocation(classDecl);
    const className = checker.symbolToString(classType.symbol);

    if (!methodName) { throw new Error("anonymous methods not supported yet!"); }
    if (!className) { throw new Error("anonymous classes not supported yet!"); }

    return {
      className,
      methodName,
      fullyQualifiedName: `${ className }__${ methodName }`,
      classType,
    };
  }

  addCompiledFunctionNode(expr: Sexpr[]): void {
    this.functionExprs.push(expr);
  }

  private getDeclaration(type: Type): MethodDeclaration | FunctionDeclaration {
    const declaration = type.symbol.valueDeclaration;

    if (declaration.kind === SyntaxKind.FunctionDeclaration) {
      return declaration as FunctionDeclaration;
    } else if (declaration.kind === SyntaxKind.MethodDeclaration) {
      return declaration as MethodDeclaration;
    } else if (declaration.kind === SyntaxKind.MethodSignature) {
      const parent = declaration.parent;

      if (parent.kind === SyntaxKind.InterfaceDeclaration) {
        const interfaceDecl = parent as InterfaceDeclaration;
        const name = interfaceDecl.name.text;
        const classDecl = this.nativeClasses[name];
        const instanceType = this.checker.getTypeAtLocation(classDecl);
        const properties = this.checker.getPropertiesOfType(instanceType);

        for (const prop of properties) {
          const decl = prop.valueDeclaration;

          if (prop.flags & SymbolFlags.Method) {
            if (prop.name === type.symbol.name) {
              return decl as MethodDeclaration;
            }
          }
        }

        throw new Error("Method not found on class.");
      } else {
        throw new Error("unhandled parent type (not interace)");
      }
    } else {
      throw new Error("Unknown method type.");
    }
  }

  /**
   * This is a helper method for addFunction. It should not be called directly.
   */
  private addMethod(type: Type): Function {
    const {
      className,
      fullyQualifiedName,
    } = this.getMethodTypeInfo(this.checker, type);
    const methodDeclaration = this.getDeclaration(type);
    const overload = BSClassDeclaration.GetOverloadType(methodDeclaration);

    const signatures = this.checker.getSignaturesOfType(type, SignatureKind.Call);
    if (signatures.length > 1) { throw new Error("Dont support functions with > 1 signature yet."); }
    const signature = signatures[0];
    const isGeneric = signature.typeParameters ? signature.typeParameters.length > 0 : false;
    const supportedTypeParams = isGeneric ? ["string", "number"] : [""];
    const typeParamSig = signature.typeParameters ? signature.typeParameters.map(x => x.symbol.name) : [];
    const id = Functions.TableIndex;

    Functions.TableIndex += supportedTypeParams.length;

    const fn: Function = {
      getFullyQualifiedName: (typeName = "") => fullyQualifiedName + (typeName === "" ? "" : "__" + typeName),
      supportedTypeParams  ,
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
      signature            : Functions.GetSignature(this.checker, type),
      isGeneric            ,
      id                   : new FunctionId(type),
    };

    this.list.push(fn);

    // TODO - only point here is to add the node, a bit silly.

    const node = new BSMethodDeclaration(this.activeScope, methodDeclaration as MethodDeclaration);
    node.compile(this.activeScope);
    this.addCompiledFunctionNode(node.getDeclaration());

    return fn;
  }

  private addFunction(type: Type): Function {
    let className: string | null = null;
    let fn       : Function;

    const functionId     = new FunctionId(type);
    let name             = functionId.id.fnName;
    const decl           = type.symbol.valueDeclaration;
    const sourceFileName = decl.getSourceFile().fileName;

    // TODO: Throw errors about anonymous functions, or something.

    const signatures = this.checker.getSignaturesOfType(type, SignatureKind.Call);

    if (signatures.length > 1) { throw new Error("Dont support functions with > 1 signature yet."); }

    const signature     = signatures[0];
    const isGeneric     = signature.typeParameters ? signature.typeParameters.length > 0 : false;
    const id            = Functions.TableIndex;
    const wasmSignature = Functions.GetSignature(this.checker, type);
    const typeParamSig  = signature.typeParameters ? signature.typeParameters.map(x => x.symbol.name) : [];
    let fullyQualifiedName: string;
    let moduleName        : string;

    if (decl.kind === SyntaxKind.FunctionDeclaration) {
      fullyQualifiedName = normalizePath(sourceFileName) + "__" + name;
      moduleName         = normalizePath(sourceFileName);
    } else if (decl.kind === SyntaxKind.ArrowFunction) {
      name               = name + String(id);
      fullyQualifiedName = name;
      moduleName         = normalizePath(sourceFileName);

    } else if (decl.kind === SyntaxKind.ImportSpecifier) {
      const impSpec = decl as ImportSpecifier;
      const impDecl = impSpec.parent.parent.parent as ImportDeclaration;

      moduleName         = normalizePath((impDecl.moduleSpecifier as StringLiteral).text);
      fullyQualifiedName = normalizePath(moduleName) + "__" + name;
    } else if (decl.kind === SyntaxKind.MethodDeclaration || decl.kind === SyntaxKind.MethodSignature) {
      return this.addMethod(type);
    } else {
      console.log(decl.kind);

      throw new Error("Unhandled function type!");
    }

    const supportedTypeParams = isGeneric ? ["string", "number"] : [""];

    Functions.TableIndex += supportedTypeParams.length;

    fn = {
      signature            : wasmSignature,
      isGeneric            ,
      typeParamSig         ,
      getFullyQualifiedName: (typeName = "") => fullyQualifiedName + (typeName === "" ? "" : "__" + typeName),
      supportedTypeParams  , 
      className            ,
      getTableIndex        : (typeName = "") => id + supportedTypeParams.indexOf(typeName),
      overload             : null,
      id                   : functionId,
    };

    this.list.push(fn);

    if (decl.kind === SyntaxKind.ArrowFunction) {
      const node = new BSArrowFunction(this.activeScope, decl as ArrowFunction);

      node.compile(this.activeScope);
      this.addCompiledFunctionNode([node.getDeclaration()]);
    } else if (decl.kind === SyntaxKind.FunctionDeclaration) {
      const node = new BSFunctionDeclaration(this.activeScope, decl as FunctionDeclaration);

      node.compile(this.activeScope);
      this.addCompiledFunctionNode(node.getDeclaration());
    }

    return fn;
  }

  count(): number {
    return this.list.length;
  }

  toString(): string {
    return this.list.map(x => x.getFullyQualifiedName("")).join(", ");
  }

  getAll(): Function[] {
    return this.list;
  }

  getAllNodes(): Sexpr[][] {
    return this.functionExprs;
  }

  /** 
   * Attempts to find the Function for the provided type.
   */
  getByType(type: Type): Function {
    const id = new FunctionId(type);

    for (const fn of this.list) {
      if (id.eq(fn.id)) {
        return fn;
      }
    }

    if (type.symbol.flags & SymbolFlags.Method || type.symbol.flags & SymbolFlags.Function) {
      return this.addFunction(type);
    } else {
      throw new Error("Unhandled type in Function#getByType");
    }
  }

  private getParentClassOfMethod(type: Type): string {
    if (type.flags & TypeFlags.StringLike) {
      return "StringImpl";
    }

    if (isArrayType(type)) {
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
    const parentName = this.getParentClassOfMethod(type);

    for (const fn of this.list) {
      if (
        fn.overload &&
        fn.overload  === operator &&
        fn.className === parentName
      ) {
        return fn;
      }
    }

    let className = "";

    if (type.flags & TypeFlags.StringLike) {
      className = Constants.NATIVE_STRING;
    } else if (isArrayType(type)) {
      className = Constants.NATIVE_ARRAY;
    } else {
      throw new Error("operator override not found for type!");
    }

    const classDecl    = this.nativeClasses[className];
    const instanceType = this.checker.getTypeAtLocation(classDecl);
    const properties   = this.checker.getPropertiesOfType(instanceType);

    for (const prop of properties) {
      const propDecl = prop.valueDeclaration;
      const propType = this.checker.getTypeAtLocation(propDecl);

      if (prop.flags & SymbolFlags.Method) {
        const propOperatorType = BSClassDeclaration.GetOverloadType(propDecl);

        if (propOperatorType && propOperatorType === operator) {
          return this.addFunction(propType);
        }
      }
    }

    throw new Error(`Could not find overload for ${ className } and ${ operator }`);
  }
}