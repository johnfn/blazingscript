import ts, { TypeFlags, Type } from "typescript";
import { Sexpr, S, Param, WasmType } from "./sexpr";
import { BSExpression } from "./parsers/expression";
import { OperatorOverload, Operator, BSMethodDeclaration } from "./parsers/method";
import { parseStatementListBS } from "./parsers/statementlist";
import { BSNode } from "./parsers/bsnode";
import { BSFunctionDeclaration } from "./parsers/function";
import { BSParameter } from "./parsers/parameter";
import { BSClassDeclaration } from "./parsers/class";
import { BSForStatement } from "./parsers/for";
import { assertNever } from "./util";
import { isArrayType } from "./parsers/arrayliteral";

enum ScopeType {
  Function = "function",
  Method   = "method",
  Class    = "class",
  Global   = "global",
  For      = "for",
};

export type Variable = {
  tsType     : ts.Type | undefined;
  wasmType   : WasmType;
  name       : string;
  isParameter: boolean;
};

export type Property = {
  tsType   : ts.Type | undefined;
  wasmType : WasmType;
  name     : string;
  offset   : number;
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

type NodesWithScope =
  | BSFunctionDeclaration
  | BSForStatement
  | BSMethodDeclaration
  | BSClassDeclaration
  ;

class Scope {
  parent    : Scope | null;
  children  : Scope[];
  variables : Variables;
  properties: Property[];

  // TODO: Since functions are scopes, i can probably remove this and just
  // filter over children.

  functions : Function[];
  loopStack : Loop[];
  node      : BSNode | null;
  type      : ScopeType;

  static NumberOfLoopsSeen = 0;

  constructor(node: NodesWithScope | null, parent: Scope | null) {
    this.node   = node;
    this.parent = parent;

    this.variables  = new Variables(this);
    this.properties = [];
    this.functions  = [];
    this.loopStack  = [];
    this.children   = [];

    this.type       = this.getScopeType(node);
  }

  getScopeType(node: NodesWithScope | null) {
    if (node instanceof BSFunctionDeclaration) {
      return ScopeType.Function;
    } else if (node instanceof BSForStatement) {
      return ScopeType.For;
    } else if (node instanceof BSMethodDeclaration) {
      return ScopeType.Method;
    } else if (node instanceof BSClassDeclaration) {
      return ScopeType.Class;
    } else if (node === null) {
      return ScopeType.Global;
    } else {
      return assertNever(node);
    }
  }

  addLoop(inc: Sexpr | null): void {
    Scope.NumberOfLoopsSeen++;

    this.loopStack.push({
      continueLabel: `$loopcontinue${ Scope.NumberOfLoopsSeen }`,
      breakLabel   : `$loopbreak${ Scope.NumberOfLoopsSeen }`,
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
    const fns  = this.functions;

    let string = `${ indent }Scope for ${ this.node ? this.node.readableName() : "[top level]" }: `;

    if (this.variables.count() === 0 && fns.length === 0) {
      string += "(Empty)\n";
    } else {
      const functions = fns.map(fn => fn.bsname).join(", ");

      string += "\n";

      if (this.variables.count() > 0) { string += `${ indent }  Variables: ${ this.variables.toString() }\n` ; }
      if (functions.length > 0) { string += `${ indent }  Functions: ${ functions }\n` ; }
    }

    for (const scope of Object.keys(this.children).map(k => this.children[Number(k)])) {
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
    const childScope = this.scope.children.filter(scope => scope.node!.uid === node.uid)[0];

    if (childScope) {
      this.scope = childScope;
    } else {
      throw new Error(`Cant find scope for ${ node.readableName() }`);
    }
  }

  addScopeFor(node: BSFunctionDeclaration | BSForStatement | BSMethodDeclaration | BSClassDeclaration): void {
    this.scope.children.push(new Scope(node, this.scope));
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

  /**
   * By default (with no scope argument) this finds all declared scopes across
   * everything.
   */
  getAllScopes(scope: Scope | null): Scope[] {
    if (scope === null) { scope = this.scope.topmostScope(); }

    let result = [scope];

    for (const child of scope.children) {
      result = result.concat(this.getAllScopes(child));
    }

    return result;
  }

  /**
   * By default (with no scope argument) this finds all declared functions across
   * everything.
   */
  getAllFunctions(scope: Scope | null = null): Function[] {
    if (scope === null) { scope = this.scope.topmostScope(); }

    const scopes = this.getAllScopes(scope);
    const functions = ([] as Function[]).concat(...scopes.map(x => x.functions));

    return functions;
  }

  /**
   * By default (with no scope argument) this finds all declared classes across
   * everything.
   */
  getAllClasses(scope: Scope | null = null): Scope[] {
    if (scope === null) { scope = this.scope.topmostScope(); }

    return this.getAllScopes(scope).filter(s => s.type === ScopeType.Class);
  }

  callMethod(props: {
    type      : Type;
    methodName: string;
    thisExpr  : BSExpression;
    argExprs  : BSExpression[];
  }): Sexpr {
    const { type, methodName, thisExpr: thisNode, argExprs } = props;

    const fn = this.getMethodByNames(type, methodName);
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
    type     : Type;
    opName   : Operator;
    thisExpr : BSNode;
    argExprs : BSNode[];
  }): Sexpr {
    const { type, thisExpr: thisNode, opName, argExprs } = props;

    const fn = this.getMethodByOperator(type, opName);
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

  getMethodByNames(type: Type, methodName: string): Function {
    const cls = this.getScopeForClass(type);

    if (cls === null) {
      throw new Error(`Cant find appropriate method`);
    }

    for (const fn of cls.functions) {
      if (fn.fnName === methodName) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${this.typeChecker.typeToString(type)} and method name ${methodName}`
    );
  }

  getMethodByOperator(type: Type, operator: Operator): Function {
    const cls = this.getScopeForClass(type);

    if (cls === null) {
      throw new Error(`Cant find appropriate method by operator`);
    }

    const functions = cls.functions;

    for (const fn of functions) {
      if (
        fn.overload &&
        fn.overload.operator === operator
      ) {
        return fn;
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${this.typeChecker.typeToString(type)} and operator name ${operator}`
    );
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

  addPropertyToScope(props: {
    name    : string;
    offset  : number;
    tsType  : Type;
    wasmType: WasmType;
  }): void {
    this.scope.properties.push(props);
  }

  getScopeForClass(type: Type): Scope | null {
    let classNameToFind = "";

    if (
      type.flags & TypeFlags.StringLike ||
      type.symbol.name === this.getNativeTypeName("String") // for this types
    ) {
      classNameToFind = this.getNativeTypeName("String");
    }

    if (
      isArrayType(this, type)
    ) {
      classNameToFind = this.getNativeTypeName("Array");
    }

    const allClasses = this.getAllClasses();
    const relevantClasses = allClasses.filter(cls => (cls.node as BSClassDeclaration).name === classNameToFind);

    if (relevantClasses.length === 0) {
      return null;
    }

    if (relevantClasses.length > 1) {
      return null;
    }

    const cls = relevantClasses[0];

    return cls;
  }

  getProperty(
    expr: BSExpression,
    name: string
  ): Sexpr {
    const cls = this.getScopeForClass(expr.tsType);

    if (cls === null) {
      throw new Error(`Cant find appropriate scope for ${ expr.fullText }`);
    }

    const props = cls.properties;

    const relevantProperties = props.filter(prop => prop.name === name);
    const relevantProperty = relevantProperties[0];

    if (!relevantProperty) {
      throw new Error(`cant find property in class`);
    }

    const res = S.Load("i32", S.Add(
      expr.compile(this),
      relevantProperty.offset
    ));

    return res;
  }
}

class Variables {
  variables: Variable[];
  scope    : Scope;

  constructor(scope: Scope) {
    this.variables = [];
    this.scope     = scope;
  }

  toString(): string {
    return this.variables.map(v => v.name).join(", ");
  }

  count(): number {
    return this.variables.length;
  }

  add(variable: {
    name        : string,
    tsType      : ts.Type | undefined,
    wasmType    : "i32",
    isParameter : boolean,
  }): void {
    if (this.variables.filter(x => x.name === variable.name).length > 0) {
      throw new Error(`Already added ${variable.name} to scope!`);
    }

    this.variables.push(variable);
  }

  /**
   * Adds variable to scope, but won't error if it's already there.
   */
  addOnce(
    name        : string,
    tsType      : ts.Type | undefined,
    wasmType    : "i32",
    isParameter = false
  ): void {
    if (this.variables.filter(x => x.name === name).length > 0) {
      return;
    }

    this.add({ name, tsType, wasmType, isParameter });
  }

  get(name: string): Sexpr {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      const found = currScope.variables.variables.filter(v => v.name === name);

      if (found.length > 1) {
        throw new Error("really weird thing in Context#getVariable")
      }

      if (found.length === 1) {
        return S.GetLocal("i32", found[0].name);
      }

      currScope = currScope.parent;
    }

    throw new Error(`variable name ${name} not found in context!`);
  }

  getAll(props: { wantParameters: boolean } ): Variable[] {
    const vars = this.variables;

    return vars.filter(v => {
      if (!props.wantParameters && v.isParameter) {
        return false;
      }

      return true;
    });
  }

}
