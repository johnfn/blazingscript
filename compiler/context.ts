import ts, { ClassDeclaration, TypeFlags } from "typescript";
import { Sexpr, S, Param } from "./sexpr";
import { BSExpression } from "./parsers/expression";
import { OperatorOverload, Operator, BSMethodDeclaration } from "./parsers/method";
import { parseStatementListBS } from "./parsers/statementlist";
import { BSNode } from "./parsers/bsnode";
import { BSFunctionDeclaration } from "./parsers/function";
import { BSForStatement } from "./parsers/for";
import { BSVariableDeclarationList } from "./parsers/variabledeclarationlist";
import { BSVariableDeclaration } from "./parsers/variabledeclaration";
import { BSVariableStatement } from "./parsers/variablestatement";
import { BSFunctionExpression } from "./parsers/functionexpression";
import { BSParameter } from "./parsers/parameter";
import { isArrayType } from "./parsers/arrayliteral";
import { BSClassDeclaration } from "./parsers/class";

type Variable = {
  tsType     : ts.Type | undefined;
  wasmType   : "i32";
  name       : string;
  isParameter: boolean;
};

type Function = {
  node     : BSFunctionDeclaration | BSMethodDeclaration;
  className: string | null;
  fnName   : string;
  bsname   : string;
  overload : OperatorOverload | null;
};

type Loop = {
  continueLabel: string;
  breakLabel   : string;
  inc          : Sexpr | null;
};

type Class = {
  name: string;
};

class Scope {
  parent           : Scope | null;
  children         : {
    scope: Scope;
    node : BSNode;
  }[];
  variables        : { [key: string]: Variable };
  functions        : Function[];
  loopStack        : Loop[];
  classStack       : Class[];
  node             : BSNode | null;

  static NumberOfLoopsSeen = 0;

  constructor(node: BSNode | null, parent: Scope | null) {
    this.node   = node;
    this.parent = parent;

    this.variables = {};
    this.functions = [];
    this.loopStack           = [];
    this.classStack          = [];
    this.children            = [];
  }

  addLoop(inc: Sexpr | null): void {
    Scope.NumberOfLoopsSeen++;

    this.loopStack.push({
      continueLabel: `$loopcontinue${ Scope.NumberOfLoopsSeen }`,
      breakLabel: `$loopbreak${ Scope.NumberOfLoopsSeen }`,
      inc
    });
  }

  popLoop() {
    this.loopStack.pop();
  }

  getCurrentLoop(): Loop {
    if (this.loopStack.length > 0) {
      return this.loopStack[this.loopStack.length - 1];
    } else {
      throw new Error("Requested getCurrentLoop when there was no loops on the stack.");
    }
  }

  getLoopContinue(): Sexpr {
    const loopInfo = this.loopStack[
      this.loopStack.length - 1
    ];

    const res = S.Block([
      ...(loopInfo.inc ? [loopInfo.inc] : []),
      S("[]", "br", loopInfo.continueLabel)
    ]);

    return res;
  }

  getLoopBreakLabel(): string {
    const loopStack = this.loopStack;

    return loopStack[loopStack.length - 1].breakLabel;
  }

  getLoopContinueLabel(): string {
    const loopStack = this.loopStack;

    return loopStack[loopStack.length - 1].continueLabel;
  }

  toString(indent = ""): string {
    const vars = this.variables;
    const fns  = this.functions;

    let string = `Scope for ${ this.node ? this.node.readableName() : "[top level]" }\n`;

    if (Object.keys(vars).length === 0 && fns.length === 0) {
      string = "Empty Scope\n";
    } else {
      string += indent + "Variables: " + Object.keys(vars).map(key => vars[key].name).join(", ") + "\n";
      string += indent + "Functions: " + fns.map(fn => fn.bsname).join(", ") + "\n";
    }

    for (const { scope } of Object.keys(this.children).map(k => this.children[Number(k)])) {
      string += scope.toString(indent + "  ");
    }

    return string;
  }

  topmostScope(): Scope {
    let result: Scope = this;

    while (result.parent !== null) {
      result = result.parent;
    }

    return result;
  }
}

export class Context {
  typeChecker: ts.TypeChecker;
  scope      : Scope;
  jsTypes    : { [jsType: string]: string } = {};

  constructor(tc: ts.TypeChecker) {
    this.typeChecker = tc;

    this.scope = new Scope(null, null);
  }

  // TODO: Somehow i want to ensure that this is actually targetting js
  // names... but im not sure how??? There are so many.
  addJsTypes(jsTypes: { [jsType: string]: string }): void {
    this.jsTypes = jsTypes;
  }

  getNativeTypeName(jsTypeName: string): string {
    return this.jsTypes[jsTypeName];
  }

  pushScopeFor(node: BSNode): void{
    const childScopeInfo = this.scope.children.filter(scope => scope.node.uid === node.uid)[0];

    if (childScopeInfo) {
      this.scope = childScopeInfo.scope;
    } else {
      throw new Error(`Cant find scope for ${ node.readableName }`);
    }
  }

  addScopeFor(node: BSNode): void {
    this.scope.children.push({
      scope: new Scope(node, this.scope),
      node ,
    });
  }

  popScope(): void {
    const parent = this.scope.parent;

    if (parent === null) {
      throw new Error("Got a null parent when I shouldn't have!");
    }

    this.scope = parent;
  }

  /**
   * Loops
   */

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

    this.scope.functions.push({
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

    for (const fn of this.scope.functions) {
      if (fn.bsname === fqName) {
        throw new Error(`Redeclaring function named ${fqName}.`);
      }
    }

    this.scope.functions.push({
      bsname   : fqName,
      node     : node,
      fnName   ,
      className,
      overload : null
    });
  }

  callMethod(props: {
    className: string;
    methodName: string;
    thisExpr: BSExpression;
    argExprs: BSExpression[];
  }): Sexpr {
    const { className, methodName, thisExpr: thisNode, argExprs } = props;

    const fn = this.getMethodByNames(className, methodName);
    const thisExpr = thisNode.compile(this);

    if (!thisExpr) {
      throw new Error("no thisexpr in Context#callMethod");
    }

    return S(
      "i32",
      "call",
      fn.bsname,
      thisExpr,
      ...parseStatementListBS(this, argExprs)
    );
  }

  callMethodByOperator(props: {
    className: string;
    opName   : Operator;
    thisExpr : BSNode;
    argExprs : BSNode[];
  }): Sexpr {
    const { className, thisExpr: thisNode, opName, argExprs } = props;

    const fn = this.getMethodByOperator(className, opName);
    const thisExpr = thisNode.compile(this);

    if (!thisExpr) {
      throw new Error("wanted nonnull");
    }

    return S(
      "i32",
      "call",
      fn.bsname,
      thisExpr,
      ...parseStatementListBS(this, argExprs)
    );
  }

  getFunctionByNode(node: BSFunctionDeclaration | BSMethodDeclaration): Function {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions) {
        if (fn.node === node) {
          return fn;
        }
      }

      currScope = currScope.parent;
    }

    throw new Error("Failed to find function by node");
  }

  getMethodByNames(className: string, methodName: string): Function {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions) {
        if (fn.className === className && fn.fnName === methodName) {
          return fn;
        }
      }

      currScope = currScope.parent;
    }

    throw new Error(
      `Failed to find function ref by class name ${className} and method name ${methodName}`
    );
  }

  getMethodByOperator(className: string, operator: Operator): Function {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      for (const fn of currScope.functions) {
        if (
          fn.className === className &&
          fn.overload &&
          fn.overload.operator === operator
        ) {
          return fn;
        }
      }

      currScope = currScope.parent;
    }

    throw new Error(
      `Failed to find function ref by class name ${className} and operator name ${operator}`
    );
  }

  addVariableToScope(variable: {
    name        : string,
    tsType      : ts.Type | undefined,
    wasmType    : "i32",
    isParameter : boolean,
  }): void {
    if (variable.name in this.scope.variables) {
      throw new Error(`Already added ${variable.name} to scope!`);
    }

    this.scope.variables[variable.name] = variable;
  }

  /**
   * Adds variable to scope, but won't error if it's already there.
   */
  addVariableToScopeOnce(
    name        : string,
    tsType      : ts.Type | undefined,
    wasmType    : "i32",
    isParameter = false
  ): void {
    if (this.scope.variables[name]) {
      return;
    }

    this.addVariableToScope({ name, tsType, wasmType, isParameter });
  }

  getVariable(name: string): Sexpr {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      const varNamesList = currScope.variables;

      if (name in varNamesList) {
        return S.GetLocal("i32", varNamesList[name].name);
      }

      currScope = currScope.parent;
    }

    throw new Error(`variable name ${name} not found in context!`);
  }

  getVariablesInCurrentScope(wantParameters: boolean): Variable[] {
    const map = this.scope.variables;

    return Object.keys(map)
      .map(x => map[x])
      .filter(v => {
        if (!wantParameters && v.isParameter) {
          return false;
        }

        return true;
      });
  }

  getParameters(
    nodes: BSParameter[]
  ): Param[] {
    return nodes.map(node => {
      let wasmType: "i32" = "i32";

      if (!(node.tsType.flags & TypeFlags.Number) && !(node.tsType.flags & TypeFlags.String)) {
        throw new Error("Unsupported parameter type!");
      }

      return {
        name: node.bindingName.text,
        type: wasmType,
      };
    });
  }
}
