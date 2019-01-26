import ts, { Node, FunctionDeclaration, ScriptTarget, TransformerFactory, CompilerOptions, DiagnosticWithLocation, MethodDeclaration, ClassDeclaration, isFunctionDeclaration, NodeFlags, SyntaxKind, Expression, NodeArray } from 'typescript';
import { Rewriter } from './rewriter';
import { sexprToString, Sexpr, S } from './sexpr';
import { add } from "./util"
import { parseExpression } from './parsers/expression';

export const THIS_NAME = "__this";

type Variable = {
  tsType     : ts.Type | undefined;
  wasmType   : "i32";
  bsname     : string;
  isParameter: boolean;
}

type Function = {
  node     : FunctionDeclaration | MethodDeclaration;
  className: string | null;
  fnName   : string;
  bsname   : string;
}

type Loop = {
  continueLabel: string;
  breakLabel   : string;
  inc          : Sexpr | null;
}

type Class = {
  name: string;
}

type Scope = {
  variableNameMapping: { [key: string]: Variable };
  functionNameMapping: Function[];
  loopStack: Loop[];
  classStack: Class[];
}

function printScope(scope: Scope): void {
  const vars = scope.variableNameMapping;
  const fns = scope.functionNameMapping;

  if (Object.keys(vars).length === 0 && fns.length === 0) {
    console.log("Empty Scope");

    return;
  }

  console.log("Variables: ", Object.keys(vars).map(key => vars[key].bsname).join(", "));
  console.log("Functions: ", fns.map(fn => fn.bsname).join(", "));
}

export class Context {
  typeChecker: ts.TypeChecker;
  scopes: Scope[];

  constructor(
    tc: ts.TypeChecker
  ) {
    this.typeChecker = tc;

    this.scopes = [
      this.makeScope()
    ];
  }

  private makeScope(): Scope {
    return {
      variableNameMapping: {},
      functionNameMapping: [],
      loopStack          : [],
      classStack         : [],
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
    const totalLoopCount = add(this.scopes.map(scope => scope.loopStack.length));

    this.localScope().loopStack.push({
      continueLabel: `$loopcontinue${ totalLoopCount }`,
      breakLabel   : `$loopbreak${ totalLoopCount }`,
      inc          ,
    });
  }

  popFromLoopStack() {
    this.localScope().loopStack.pop();
  }

  getLoopContinue(): Sexpr {
    const loopInfo = this.localScope().loopStack[this.localScope().loopStack.length - 1];

    const res = S.Block([
      ...(loopInfo.inc ? [loopInfo.inc] : []),
      S("[]", "br", loopInfo.continueLabel),
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
    parent: ClassDeclaration
  }): void {
    const { node, parent } = props;

    let fqName: string;
    let fnName: string;
    let className: string;

    const md = node as MethodDeclaration;

    if (!md.name) throw new Error("anonymous methods not supported yet!")
    if (!parent) throw new Error("no parent provided to addFunction for method.");
    if (!parent.name) throw new Error("dont support classes without names yet");

    fqName = "$" + parent.name.text + "__" + md.name!.getText();
    fnName = md.name!.getText();
    className = parent.name.text;

    this.globalScope().functionNameMapping.push({
      bsname: fqName,
      node,
      fnName,
      className,
    });
  }

  callMethod(props: {
    className : string;
    methodName: string;
    thisExpr  : Expression;
    argExprs  : Expression[];
  }): Sexpr {
    const { className, methodName, thisExpr: thisNode, argExprs } = props;

    const fn = this.getMethodByNames(className, methodName);

    return S(
      "i32",
      "call",
      fn.bsname,
      parseExpression(this, thisNode), // always pass this as first arg
      ...(argExprs.map(arg => parseExpression(this, arg))),
    );
  }

  addFunction(node: FunctionDeclaration): void {
    let fqName: string;
    let fnName: string;
    let className: string | null = null;

    const fd = node as FunctionDeclaration;

    if (!fd.name) {
      throw new Error("anonymous functions not supported yet!")
    }

    fqName = "$" + fd.name!.text;
    fnName = fd.name!.text;

    for (const fn of this.localScope().functionNameMapping) {
      if (fn.bsname === fqName) {
        throw new Error(`Redeclaring function named ${ fqName }.`);
      }
    }

    this.localScope().functionNameMapping.push({
      bsname: fqName,
      node,
      fnName,
      className,
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

    throw new Error(`Failed to find function ref by class name ${ className } and method name ${ methodName }`);
  }

  addVariableToScope(name: string, tsType: ts.Type | undefined, wasmType: "i32", parameter = false): void {
    const mapping = this.localScope().variableNameMapping;

    if (name in mapping) {
      throw new Error(`Already added ${ name } to scope!`);
    }

    mapping[name] = {
      tsType,
      wasmType,
      bsname: name,
      isParameter: parameter,
    };
  }

  getVariable(name: string): Sexpr {
    const varNamesList = this.scopes.slice().reverse().map(x => x.variableNameMapping);

    for (const varNames of varNamesList) {
      if (name in varNames) {
        return S.GetLocal("i32", varNames[name].bsname);
      }
    }

    throw new Error(`variable name ${ name } not found in context!`);
  }

  getVariablesInCurrentScope(wantParameters: boolean): Variable[] {
    const map = this.scopes[this.scopes.length - 1].variableNameMapping;

    return Object.keys(map).map(x => map[x]).filter(v => {
      if (!wantParameters && v.isParameter) {
        return false;
      }

      return true;
    });
  }
}

export class Program {
  code: string;
  
  typeChecker: ts.TypeChecker;
  program    : ts.Program;

  constructor(code: string) {
    this.code = code;

    const outputs = [];

    this.program = ts.createProgram(["file.ts"], {}, {
      readFile: (fileName: string) => {
        return code;
      },
      getSourceFile: function (filename, languageVersion) {
        if (filename === "file.ts") {
          return ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
        }

        return undefined;
      },
      writeFile: function (name, text, writeByteOrderMark) {
          outputs.push({ name: name, text: text, writeByteOrderMark: writeByteOrderMark });
      },
      getDirectories: () => { return [] },
      fileExists: (fileName: string) => {
        if (fileName === "file.ts") {
          return true;
        }

        return false;
      },
      getDefaultLibFileName: function () { return "lib.d.ts"; },
      useCaseSensitiveFileNames: function () { return false; },
      getCanonicalFileName: function (filename) { return filename; },
      getCurrentDirectory: function () { return ""; },
      getNewLine: function () { return "\n"; },
    });

    this.typeChecker = this.program.getTypeChecker()
  }

  parse(): string {
    const ctx = new Context(this.typeChecker);
    const source = this.program.getSourceFile("file.ts");

    if (!source) {
      throw new Error("source undefined, something has gone horribly wrong!!!");
    }

    const sexpr = new Rewriter(
      source,
      ctx
    ).parse();

    return sexprToString(sexpr);
  }
}


/*
    //const emitResolver = getDiagnosticsProducingTypeChecker().getEmitResolver((options.outFile || options.out) ? undefined : sourceFile, cancellationToken);

    const transform = ts.transform(source, [
      (fufu: any) => {
        console.log(fufu.getEmitResolver());

        return (ts as any).transformTypeScript(fufu)
      },
      (ts as any).transformES2015,
      (ts as any).transformGenerators,
      // (ts as any).transformES2015Module,
      (ts as any).transformES5,
    ], {
      "target": ScriptTarget.ES5,
    });

    const basdlf = (ts as any).transformNodes( )

    console.log("Trans!", transform.transformed.length)
    console.log(transform.transformed[0].getText())

function betterTransform<T extends Node>(source: T | T[], transformers: TransformerFactory<T>[], compilerOptions?: CompilerOptions) {
  const diagnostics: DiagnosticWithLocation[] = [];
  compilerOptions = (ts as any).fixupCompilerOptions(compilerOptions!, diagnostics); // TODO: GH#18217
  const nodes = isArray(source) ? source : [source];
  const result = (ts as any).transformNodes(undefined, undefined, compilerOptions, nodes, transformers, true);
  result.diagnostics = concatenate(result.diagnostics, diagnostics);
  return result;
}
*/