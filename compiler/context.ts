import ts, {
  Node,
  FunctionDeclaration,
  ScriptTarget,
  TransformerFactory,
  CompilerOptions,
  DiagnosticWithLocation,
  MethodDeclaration,
  ClassDeclaration,
  isFunctionDeclaration,
  NodeFlags,
  SyntaxKind,
  Expression,
  NodeArray
} from "typescript";
import { sexprToString, Sexpr, S } from "./sexpr";
import { add } from "./util";
import { parseExpression, BSExpressionNode } from "./parsers/expression";
import { OperatorOverload, Operator } from "./parsers/method";
import { parseStatementListBS } from "./parsers/statementlist";
import { BSNode } from "./parsers/bsnode";
import { BSThisKeyword } from "./parsers/this";

type Variable = {
  tsType: ts.Type | undefined;
  wasmType: "i32";
  bsname: string;
  isParameter: boolean;
};

type Function = {
  node: FunctionDeclaration | MethodDeclaration;
  className: string | null;
  fnName: string;
  bsname: string;
  overload: OperatorOverload | null;
};

type Loop = {
  continueLabel: string;
  breakLabel: string;
  inc: Sexpr | null;
};

type Class = {
  name: string;
};

type Scope = {
  variableNameMapping: { [key: string]: Variable };
  functionNameMapping: Function[];
  loopStack: Loop[];
  classStack: Class[];
};

function printScope(scope: Scope): void {
  const vars = scope.variableNameMapping;
  const fns = scope.functionNameMapping;

  if (Object.keys(vars).length === 0 && fns.length === 0) {
    console.log("Empty Scope");

    return;
  }

  console.log(
    "Variables: ",
    Object.keys(vars)
      .map(key => vars[key].bsname)
      .join(", ")
  );
  console.log("Functions: ", fns.map(fn => fn.bsname).join(", "));
}

export class Context {
  typeChecker: ts.TypeChecker;
  scopes: Scope[];
  jsTypes: { [jsType: string]: string } = {};

  constructor(tc: ts.TypeChecker) {
    this.typeChecker = tc;

    this.scopes = [this.makeScope()];
  }

  // TODO: Somehow i want to ensure that this is actually targetting js
  // names... but im not sure how??? There are so many.
  addJsTypes(jsTypes: { [jsType: string]: string }): void {
    this.jsTypes = jsTypes;
  }

  getNativeTypeName(jsTypeName: string): string {
    return this.jsTypes[jsTypeName];
  }

  private makeScope(): Scope {
    return {
      variableNameMapping: {},
      functionNameMapping: [],
      loopStack: [],
      classStack: []
    };
  }

  localScope(): Scope {
    return this.scopes[this.scopes.length - 1];
  }

  globalScope(): Scope {
    return this.scopes[0];
  }

  pushScope(): void {
    this.scopes.push(this.makeScope());
  }

  popScope(): void {
    this.scopes.pop();
  }

  /**
   * Loops
   */

  addToLoopStack(inc: Sexpr | null) {
    const totalLoopCount = add(
      this.scopes.map(scope => scope.loopStack.length)
    );

    this.localScope().loopStack.push({
      continueLabel: `$loopcontinue${totalLoopCount}`,
      breakLabel: `$loopbreak${totalLoopCount}`,
      inc
    });
  }

  popFromLoopStack() {
    this.localScope().loopStack.pop();
  }

  getLoopContinue(): Sexpr {
    const loopInfo = this.localScope().loopStack[
      this.localScope().loopStack.length - 1
    ];

    const res = S.Block([
      ...(loopInfo.inc ? [loopInfo.inc] : []),
      S("[]", "br", loopInfo.continueLabel)
    ]);

    return res;
  }

  getLoopBreakLabel(): string {
    const loopStack = this.localScope().loopStack;

    return loopStack[loopStack.length - 1].breakLabel;
  }

  getLoopContinueLabel(): string {
    const loopStack = this.localScope().loopStack;

    return loopStack[loopStack.length - 1].continueLabel;
  }

  addMethod(props: {
    node: MethodDeclaration;
    parent: ClassDeclaration;
    overload: OperatorOverload | null;
  }): void {
    const { node, parent, overload } = props;

    let fqName: string;
    let fnName: string;
    let className: string;

    const md = node as MethodDeclaration;

    if (!md.name) throw new Error("anonymous methods not supported yet!");
    if (!parent)
      throw new Error("no parent provided to addFunction for method.");
    if (!parent.name) throw new Error("dont support classes without names yet");

    fqName = "$" + parent.name.text + "__" + md.name!.getText();
    fnName = md.name!.getText();
    className = parent.name.text;

    this.globalScope().functionNameMapping.push({
      bsname: fqName,
      node,
      fnName,
      className,
      overload
    });
  }

  callMethod(props: {
    className: string;
    methodName: string;
    thisExpr: BSExpressionNode;
    argExprs: BSExpressionNode[];
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
    opName: Operator;
    thisExpr: BSNode;
    argExprs: BSNode[];
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

  addFunction(node: FunctionDeclaration): void {
    let fqName: string;
    let fnName: string;
    let className: string | null = null;

    const fd = node as FunctionDeclaration;

    if (!fd.name) {
      throw new Error("anonymous functions not supported yet!");
    }

    fqName = "$" + fd.name!.text;
    fnName = fd.name!.text;

    for (const fn of this.localScope().functionNameMapping) {
      if (fn.bsname === fqName) {
        throw new Error(`Redeclaring function named ${fqName}.`);
      }
    }

    this.localScope().functionNameMapping.push({
      bsname: fqName,
      node,
      fnName,
      className,
      overload: null
    });
  }

  getFunctionByNode(node: FunctionDeclaration | MethodDeclaration): Function {
    for (const scope of this.scopes) {
      for (const fn of scope.functionNameMapping) {
        if (fn.node === node) {
          return fn;
        }
      }
    }

    throw new Error("Failed to find function by node");
  }

  getMethodByNames(className: string, methodName: string): Function {
    for (const scope of this.scopes) {
      for (const fn of scope.functionNameMapping) {
        if (fn.className === className && fn.fnName === methodName) {
          return fn;
        }
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${className} and method name ${methodName}`
    );
  }

  getMethodByOperator(className: string, operator: Operator): Function {
    for (const scope of this.scopes) {
      for (const fn of scope.functionNameMapping) {
        if (
          fn.className === className &&
          fn.overload &&
          fn.overload.operator === operator
        ) {
          return fn;
        }
      }
    }

    throw new Error(
      `Failed to find function ref by class name ${className} and operator name ${operator}`
    );
  }

  addVariableToScope(
    name: string,
    tsType: ts.Type | undefined,
    wasmType: "i32",
    parameter = false
  ): void {
    const mapping = this.localScope().variableNameMapping;

    if (name in mapping) {
      throw new Error(`Already added ${name} to scope!`);
    }

    mapping[name] = {
      tsType,
      wasmType,
      bsname: name,
      isParameter: parameter
    };
  }

  getVariable(name: string): Sexpr {
    const varNamesList = this.scopes
      .slice()
      .reverse()
      .map(x => x.variableNameMapping);

    for (const varNames of varNamesList) {
      if (name in varNames) {
        return S.GetLocal("i32", varNames[name].bsname);
      }
    }

    throw new Error(`variable name ${name} not found in context!`);
  }

  getVariablesInCurrentScope(wantParameters: boolean): Variable[] {
    const map = this.scopes[this.scopes.length - 1].variableNameMapping;

    return Object.keys(map)
      .map(x => map[x])
      .filter(v => {
        if (!wantParameters && v.isParameter) {
          return false;
        }

        return true;
      });
  }
}
