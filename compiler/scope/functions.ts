import { BSMethodDeclaration, OperatorOverload, Operator } from "../parsers/method";
import { BSClassDeclaration } from "../parsers/class";
import { BSFunctionDeclaration } from "../parsers/function";
import { Type } from "typescript";
import { BSExpression } from "../parsers/expression";
import { Sexpr, S, WasmType } from "../sexpr";
import { parseStatementListBS } from "../parsers/statementlist";
import { BSNode } from "../parsers/bsnode";
import { Scope } from "./scope";
import { BSIdentifier } from "../parsers/identifier";
import { BSCallExpression } from "../parsers/callexpression";
import { BSPropertyAccessExpression } from "../parsers/propertyaccess";
import { BSArrowFunction } from "../parsers/arrowfunction";
import { assertNever } from "../util";
import { BSImportSpecifier } from "../parsers/importspecifier";

// TODO should probably rename this as to not clash with Function the js type

export const TsTypeToWasmType = (type: Type): WasmType => {
  return "i32";
}

export type WasmFunctionSignature = {
  parameters: WasmType[];
  return    : WasmType;
  name      : string;
}

type FunctionNode =
  | BSFunctionDeclaration
  | BSMethodDeclaration
  | BSArrowFunction

export type Function = {
  /**
   * Name of the function, e.g. indexOf
   */
  name              : string;

  /**
   * Fully qualified name of the function, e.g. Array__indexOf
   */
  fullyQualifiedName: string;

  node              : FunctionNode;
  className         : string | null;
  overload          : OperatorOverload | null;
  tableIndex        : number;
  signature         : WasmFunctionSignature;
};

export class Functions {
  private static TableIndex = 0;

  /**
   * These are used for building the function table.
   */
  public static AllSignatures: { [key: string]: WasmFunctionSignature } = {};

  functions: Function[];
  scope    : Scope;

  constructor(scope: Scope) {
    this.functions = [];
    this.scope     = scope;
  }

  static GetSignature(node: BSMethodDeclaration | BSFunctionDeclaration | BSCallExpression | BSArrowFunction): WasmFunctionSignature {
    let params: WasmType[];

    if (
      node instanceof BSMethodDeclaration ||
      node instanceof BSFunctionDeclaration ||
      node instanceof BSArrowFunction
    ) {
      params = node.parameters.map(param => TsTypeToWasmType(param.tsType));

      if (node instanceof BSMethodDeclaration) {
        // Need to add implicit this argument!

        params = ["i32", ...params];
      }
    } else {
      params = node.arguments.map(arg => TsTypeToWasmType(arg.tsType));

      if (node.expression instanceof BSPropertyAccessExpression) {
        // Need to add implicit this argument!

        params = ["i32", ...params];
      }
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

  addMethod(props: {
    node    : BSMethodDeclaration;
    parent  : BSClassDeclaration;
    overload: OperatorOverload | null;
  }): void {
    const { node, parent, overload } = props;

    let fullyQualifiedName: string;
    let className: string;

    if (!node.name) { throw new Error("anonymous methods not supported yet!"); }
    if (!parent) { throw new Error("no parent provided to addFunction for method."); }
    if (!parent.name) { throw new Error("dont support anonymous classes yet!"); }

    fullyQualifiedName    = "$" + parent.name + "__" + node.name;
    className = parent.name;

    this.functions.push({
      name              : node.name,
      fullyQualifiedName,
      node              ,
      className         ,
      overload          ,
      tableIndex        : Functions.TableIndex++,
      signature         : Functions.GetSignature(node),
    });
  }

  addFunction(node: BSFunctionDeclaration | BSArrowFunction): Function {
    let id       : number;
    let name     : string;
    let className: string | null = null;

    if (node instanceof BSFunctionDeclaration) {
      id = Functions.TableIndex++;

      if (node.name) {
        name = node.name
      } else {
        name = `anon_${ id }`;
      }
    } else if (node instanceof BSArrowFunction) {
      id = Functions.TableIndex++;

      name = `arrow_${ id }`;
    } else {
      return assertNever(node);
    }

    for (const fn of this.functions) {
      if (fn.name === name) {
        throw new Error(`Redeclaring function named ${name}.`);
      }
    }

    const fn: Function = {
      node              : node,
      name              : name,
      fullyQualifiedName: name,
      className         ,
      tableIndex        : id,
      overload          : null,
      signature         : Functions.GetSignature(node),
    }

    this.functions.push(fn);

    return fn;
  }

  count(): number {
    return this.functions.length;
  }

  toString(): string {
    return this.functions.map(x => x.name).join(", ");
  }

  /**
   * By default (with no scope argument) this finds all declared functions across
   * everything.
   */
  getAll(scope: Scope | null = null): Function[] {
    if (scope === null) { scope = this.scope; }

    const scopes = this.scope.getAllScopes(scope);
    const functions = ([] as Function[]).concat(...scopes.map(x => x.functions.functions));

    return functions;
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

  getFunctionByNode(node: FunctionNode): Function {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions.functions) {
        if (fn.node === node) {
          return fn;
        }
      }

      currScope = currScope.parent;
    }

    throw new Error("Failed to find function by node");
  }

  getFunctionByName(name: string): Function | null {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions.functions) {
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
      for (const fn of currScope.functions.functions) {
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

    for (const fn of cls.functions.functions) {
      if (fn.name === methodName) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${this.scope.typeChecker.typeToString(type)} and method name ${methodName}`
    );
  }

  getMethodByOperator(type: Type, operator: Operator): Function {
    const cls = this.scope.getScopeForClass(type);

    if (cls === null) {
      throw new Error(`Cant find appropriate method by operator`);
    }

    const functions = cls.functions.functions;

    for (const fn of functions) {
      if (
        fn.overload &&
        fn.overload.operator === operator
      ) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${this.scope.typeChecker.typeToString(type)} and operator name ${operator}`
    );
  }
}