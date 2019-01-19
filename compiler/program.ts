import ts, { SyntaxKind, parseJsonSourceFileConfigFileContent, FunctionDeclaration, SyntaxList, ParameterDeclaration, Block, Statement, isSwitchStatement, ReturnStatement, Expression, BinaryExpression, Identifier, SuperExpression } from 'typescript';
import { Rewriter } from './rewriter';
import { Sexpr, sexprToString } from './sexpr';

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
    const sexpr = new Rewriter(
      this.program.getSourceFile("file.ts")!,
      this
    ).parse();

    return sexprToString(sexpr);
  }
}
