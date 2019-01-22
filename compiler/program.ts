import ts, { Node, FunctionDeclaration, ScriptTarget, TransformerFactory, CompilerOptions, DiagnosticWithLocation } from 'typescript';
import { Rewriter } from './rewriter';
import { sexprToString, Sexpr, S } from './sexpr';

type Type = {
  type: ts.Type | undefined;
  name: string;
}

export class Context {
  typeChecker: ts.TypeChecker;
  variableNameMapping: { [key: string]: Type } = {};
  functionNameToNodeMapping: { [key: string]: FunctionDeclaration } = {};

  constructor(
    tc: ts.TypeChecker,
    variableNameMapping: { [key: string]: Type }
  ) {
    this.typeChecker = tc;
    this.variableNameMapping = variableNameMapping
  }

  clone(): Context {
    const newContext = new Context(this.typeChecker, this.variableNameMapping);

    return newContext;
  }

  addFunction(name: string, node: FunctionDeclaration, inline = false): void {
    if (name in this.functionNameToNodeMapping) {
      throw new Error(`Redeclaring function named ${ name }.`);
    }

    this.functionNameToNodeMapping[name] = node;
  }

  addVariableToScope(name: string, type: ts.Type | undefined): void {
    this.variableNameMapping[name] = {
      type,
      name,
    };
  }

  getVariable(name: string): Sexpr {
    if (name in this.variableNameMapping) {
      const obj = this.variableNameMapping[name];

      return S.GetLocal("i32", obj.name);
    } else {
      throw new Error(`variable name ${ name } not found in context!`);
    }
  }

  getFunction(name: string): FunctionDeclaration {
    if (name in this.functionNameToNodeMapping) {
      return this.functionNameToNodeMapping[name];
    }

    throw new Error(`No function named ${ name }.`);
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
    const ctx = new Context(this.typeChecker, {});
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