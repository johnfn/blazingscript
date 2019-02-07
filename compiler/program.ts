import ts, { Node, ModuleKind, ScriptTarget } from "typescript";
import fs from "fs";
import { sexprToString, Sexpr, S } from "./sexpr";
import { Scope } from "./scope/scope";
import { Function } from "./scope/functions";
import { BSSourceFile } from "./parsers/sourcefile";
import { Functions } from "./scope/functions";
import { flatten } from "./rewriter";
import { BSNode } from "./parsers/bsnode";
import { BSClassDeclaration } from "./parsers/class";
import { BSCallExpression } from "./parsers/callexpression";
import { BSIdentifier } from "./parsers/identifier";

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
        "defs.ts",
        "testother.ts",
        "./testother.ts",
      ],
      {
        experimentalDecorators: true,
        target                : ScriptTarget.ES2016,
        module                : ModuleKind.CommonJS,
        esModuleInterop       : true,
      },
      {
        readFile: (fileName: string) => {
          return code;
        },
        getSourceFile: function(fileName, languageVersion) {
          if (fileName === "file.ts") {
            return ts.createSourceFile(
              fileName,
              fs.readFileSync("__tests__/bs/testcontents.ts").toString(),
              ts.ScriptTarget.Latest,
              true
            );
          }

          if (fileName === "defs.ts") {
            return ts.createSourceFile(
              fileName,
              fs.readFileSync("__tests__/bs/defs.ts").toString(),
              ts.ScriptTarget.Latest,
              true
            );
          }

          if (fileName === "testother.ts") {
            return ts.createSourceFile(
              fileName,
              fs.readFileSync("__tests__/bs/testother.ts").toString(),
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

          if (fileName === "testother.ts") {
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

    const allFiles: Sexpr[][] = [];
    const ctx = new Scope(this.typeChecker, source, null, null, null);

    ctx.addJsTypes({
      "String": "StringInternal",
      "Array" : "ArrayInternal",
    });

    allFiles.push(new BSSourceFile(ctx, source).compile(ctx));

    let functions = ctx.functions.getAll(ctx.topmostScope());
    const modules = ctx.modules.getAll();

    for (const module of modules) {
      const source = this.program.getSourceFile("testother.ts");

      if (!source) {
        throw new Error("source undefined, something has gone horribly wrong!!!");
      }

      allFiles.push(new BSSourceFile(ctx, source).compile(ctx));
      functions = functions.concat(ctx.functions.getAll(ctx.topmostScope()))
    }

    functions = functions.sort((a, b) => a.tableIndex - b.tableIndex);

    const resultSexpr = S(
      "[]", "module",
      S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
      S("[]", "import", '"js"', '"table"', S("[]", "table", String(functions.length), "anyfunc")),
      S("[]", "import", '"c"', '"log"',
        S("[]", "func", "$log", ...[...Array(9).keys()].map(_ => S("[]", "param", "i32")))
      ),
      ...Object.keys(Functions.AllSignatures).map(sigName => {
        // Build all function wasm type signatures

        const sig = Functions.AllSignatures[sigName];

        return S(
          "[]", "type",
          sig.name,
          S("[]", "func",
            ...sig.parameters.map(param => S("[]", "param", param)),
            S("[]", "result", "i32")
          ),
          ";; \n"
        );
      }),

      ...flatten(allFiles),

      ...functions.map(fn => S.Export(fn.fullyQualifiedName)),
      S("[]", "elem", S.Const(0),
        ...functions.map(fn => {
          return `$${ fn.fullyQualifiedName } ;; ${ fn.tableIndex }\n`;
        })
      )
    );

    return sexprToString(resultSexpr);
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
