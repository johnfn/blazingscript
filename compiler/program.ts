import ts from 'typescript';
import { Rewriter } from './rewriter';
import { sexprToString, Sexpr, S } from './sexpr';

type Type = {
  type: ts.Type | undefined;
  name: string;
  repr: "static" | "var";
}

export class Context {
  typeChecker: ts.TypeChecker;
  variableNameMapping: { [key: string]: Type } = {};

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

  addVariableToScope(name: string, type: ts.Type | undefined, statik = false): void {
    this.variableNameMapping[name] = {
      type,
      name,
      repr: statik ? "static" : "var",
    };
  }

  getVariable(name: string): Sexpr {
    if (name in this.variableNameMapping) {
      const obj = this.variableNameMapping[name];

      if (obj.repr === "var") {
        return S.GetLocal("i32", obj.name);
      } else {
        throw new Error("Cant handle statically known variables, yet.")
      }
    } else {
      throw new Error(`variable name ${ name } not found in context!`);
    }
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

    const sexpr = new Rewriter(
      this.program.getSourceFile("file.ts")!,
      ctx
    ).parse();

    return sexprToString(sexpr);
  }
}
