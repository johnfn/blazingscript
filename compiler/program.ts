import ts, { ModuleKind, ScriptTarget } from "typescript";
import fs from "fs";
import { sexprToString, Sexpr, S } from "./sexpr";
import { Scope } from "./scope/scope";
import { BSSourceFile } from "./parsers/sourcefile";

export const THIS_NAME = "__this";

export class Program {
  code: string;

  typeChecker: ts.TypeChecker;
  program: ts.Program;

  constructor(code: string) {
    this.code = code;

    const outputs = [];

    this.program = ts.createProgram(
      [
        "file.ts",
        "bs.d.ts",
      ],
      {
        experimentalDecorators: true,
        target                : ScriptTarget.ES2016,
        module                : ModuleKind.CommonJS,
        esModuleInterop       : true,
      },
      {
        readFile: (fileName: string) => {
          console.log("Read", fileName);

          return code;
        },
        getSourceFile: function(fileName, languageVersion) {
          if (fileName === "file.ts") {
            return ts.createSourceFile(
              fileName,
              fs.readFileSync("__tests__/testcontents.ts").toString(),
              ts.ScriptTarget.Latest,
              true
            );
          }

          if (fileName === "bs.d.ts") {
            return ts.createSourceFile(
              fileName,
              fs.readFileSync("__tests__/bs.d.ts").toString(),
              ts.ScriptTarget.Latest,
              true
            );
          }

          return undefined;
        },
        writeFile: function(name, text, writeByteOrderMark) {
          outputs.push({
            name: name,
            text: text,
            writeByteOrderMark: writeByteOrderMark
          });
        },
        getDirectories: () => {
          return [];
        },
        fileExists: (fileName: string) => {
          if (fileName === "file.ts") {
            return true;
          }

          if (fileName === "bs.d.ts") {
            return true;
          }

          return false;
        },
        getDefaultLibFileName: function() {
          return "bs.d.ts";
        },
        useCaseSensitiveFileNames: function() {
          return false;
        },
        getCanonicalFileName: function(filename) {
          return filename;
        },
        getCurrentDirectory: function() {
          return "";
        },
        getNewLine: function() {
          return "\n";
        }
      }
    );

    const res = this.program.getGlobalDiagnostics();

    for (const d of this.program.getGlobalDiagnostics()) {
      console.log(d)
    }

    this.typeChecker = this.program.getTypeChecker();
  }

  parse(): string {
    const source = this.program.getSourceFile("file.ts");

    if (!source) {
      throw new Error("source undefined, something has gone horribly wrong!!!");
    }

    const ctx = new Scope(this.typeChecker, source, null, null);

    const result = new BSSourceFile(ctx, source).compile(ctx);

    return sexprToString(result);
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
