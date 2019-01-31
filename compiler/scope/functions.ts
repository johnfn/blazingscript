import { BSMethodDeclaration, OperatorOverload, Operator } from "../parsers/method";
import { BSClassDeclaration } from "../parsers/class";
import { BSFunctionDeclaration } from "../parsers/function";
import { Scope } from "./context";
import { Type } from "typescript";
import { BSExpression } from "../parsers/expression";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "../parsers/statementlist";
import { BSNode } from "../parsers/bsnode";

// TODO should probably rename this as to not clash with Function the js type

export type Function = {
  node     : BSFunctionDeclaration | BSMethodDeclaration;
  className: string | null;
  fnName   : string;
  bsname   : string;
  overload : OperatorOverload | null;
};

export class Functions {
  functions: Function[];
  scope    : Scope;

  constructor(scope: Scope) {
    this.functions = [];
    this.scope     = scope;
  }

  addMethod(props: {
    node    : BSMethodDeclaration;
    parent  : BSClassDeclaration;
    overload: OperatorOverload | null;
  }): void {
    const { node, parent, overload } = props;

    let fqName: string;
    let fnName: string;
    let className: string;

    if (!node.name) { throw new Error("anonymous methods not supported yet!"); }
    if (!parent) { throw new Error("no parent provided to addFunction for method."); }
    if (!parent.name) { throw new Error("dont support classes without names yet"); }

    fqName    = "$" + parent.name + "__" + node.name;
    fnName    = node.name;
    className = parent.name;

    this.functions.push({
      bsname   : fqName,
      node     ,
      fnName   ,
      className,
      overload
    });
  }

  addFunction(node: BSFunctionDeclaration): void {
    let fqName: string;
    let fnName: string;
    let className: string | null = null;

    if (!node.name) {
      throw new Error("anonymous functions not supported yet!");
    }

    fqName = "$" + node.name;
    fnName = node.name;

    for (const fn of this.functions) {
      if (fn.bsname === fqName) {
        throw new Error(`Redeclaring function named ${fqName}.`);
      }
    }

    this.functions.push({
      bsname   : fqName,
      node     : node,
      fnName   ,
      className,
      overload : null
    });
  }

  count(): number {
    return this.functions.length;
  }

  toString(): string {
    return this.functions.map(x => x.fnName).join(", ");
  }

  /**
   * By default (with no scope argument) this finds all declared functions across
   * everything.
   */
  getAll(scope: Scope | null = null): Function[] {
    if (scope === null) { scope = this.scope.topmostScope(); }

    const scopes = this.scope.context.getAllScopes(scope);
    const functions = ([] as Function[]).concat(...scopes.map(x => x.functions.functions));

    return functions;
  }

  callMethod(props: {
    type      : Type;
    methodName: string;
    thisExpr  : BSExpression;
    argExprs  : BSExpression[];
  }): Sexpr {
    const { type, methodName, thisExpr: thisNode, argExprs } = props;

    const fn = this.getMethodByNames(type, methodName);
    const thisExpr = thisNode.compile(this.scope.context);

    if (!thisExpr) {
      throw new Error("no thisexpr in Context#callMethod");
    }

    return S(
      "i32",
      "call",
      fn.bsname,
      thisExpr,
      ...parseStatementListBS(this.scope.context, argExprs)
    );
  }

  callMethodByOperator(props: {
    type     : Type;
    opName   : Operator;
    thisExpr : BSNode;
    argExprs : BSNode[];
  }): Sexpr {
    const { type, thisExpr: thisNode, opName, argExprs } = props;

    const fn = this.getMethodByOperator(type, opName);
    const thisExpr = thisNode.compile(this.scope.context);

    if (!thisExpr) {
      throw new Error("wanted nonnull");
    }

    return S(
      "i32",
      "call",
      fn.bsname,
      thisExpr,
      ...parseStatementListBS(this.scope.context, argExprs)
    );
  }

  getFunctionByNode(node: BSFunctionDeclaration | BSMethodDeclaration): Function {
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

  getMethodByNames(type: Type, methodName: string): Function {
    const cls = this.scope.context.getScopeForClass(type);

    if (cls === null) {
      throw new Error(`Cant find appropriate method`);
    }

    for (const fn of cls.functions.functions) {
      if (fn.fnName === methodName) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${this.scope.context.typeChecker.typeToString(type)} and method name ${methodName}`
    );
  }

  getMethodByOperator(type: Type, operator: Operator): Function {
    const cls = this.scope.context.getScopeForClass(type);

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
      `Failed to find function ref by class name ${this.scope.context.typeChecker.typeToString(type)} and operator name ${operator}`
    );
  }
}