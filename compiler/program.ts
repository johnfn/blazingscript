import ts, { Node, ModuleKind, ScriptTarget } from "typescript";
import fs from "fs";
import path from "path";
import { sexprToString, Sexpr, S } from "./sexpr";
import { Scope, ScopeName } from "./scope/scope";
import { BSSourceFile } from "./parsers/sourcefile";
import { Functions } from "./scope/functions";
import { flatten } from "./rewriter";

export const THIS_NAME = "__this";

export class Program {
  typeChecker: ts.TypeChecker;
  program    : ts.Program;
  paths      : string[];

  constructor(props: {
    paths: string[];
    root : string;
  }) {
    const { paths, root } = props;

    this.paths = paths;

    this.program = ts.createProgram(paths, {
      experimentalDecorators: true,
      target                : ScriptTarget.ES2016,
      module                : ModuleKind.CommonJS,
      esModuleInterop       : true,
    },
    {
      readFile: (fileName: string) => {
        throw new Error("? dunno what this is ?")
      },
      getSourceFile: (fileName, languageVersion) => {
        const filePath = path.join(root, fileName);

        if (!fs.existsSync(filePath)) {
          throw new Error(`Can't find file: ${ filePath }`);
        }

        return ts.createSourceFile(
          fileName,
          fs.readFileSync(filePath).toString(),
          ts.ScriptTarget.Latest,
          /* setParentNodes */ true
        );
      },
      writeFile: (name, text, writeByteOrderMark) => {

      },
      getDirectories: () => {
        return [];
      },
      fileExists: (fileName: string) => {
        const name = fileName.toLowerCase();

        return paths.map(path => path.toLowerCase()).filter(path => path.indexOf(name) > -1).length > 0
      },
      getDefaultLibFileName: function() {
        return "bs.d.ts";
      },
      useCaseSensitiveFileNames: function() {
        return false;
      },
      getCanonicalFileName: (filename) => {
        return filename;
      },
      getCurrentDirectory: function() {
        return "";
      },
      getNewLine: function() {
        return "\n";
      }
    });

    const res = this.program.getGlobalDiagnostics();

    for (const d of res) {
      console.log(d)
    }

    const res2 = this.program.getSemanticDiagnostics();

    for (const d of res2) {
      console.log(d.messageText)
    }


    this.typeChecker = this.program.getTypeChecker();
  }

  parse(): string {
    const allFiles   : Sexpr[][] = [];
    const allContexts: Scope[] = [];

    for (const path of this.paths) {
      const source = this.program.getSourceFile(path);

      if (!source) {
        throw new Error("source undefined, something has gone horribly wrong!!!");
      }

      const scope = new Scope({
        tc        : this.typeChecker, 
        sourceFile: source, 
        parent    : null, 
        scopeType : { type: ScopeName.SourceFile, sourceFile: source },
      });

      scope.addJsTypes({
        "String": "StringImpl",
        "Array" : "ArrayImpl",
      });

      allFiles.push(new BSSourceFile(scope, source).compile(scope));
      allContexts.push(scope);
    }

    let functions = flatten(allContexts.map(scope => scope.functions.getAll())).sort((a, b) => a.tableIndex - b.tableIndex);
    const namesToExport = [...new Set(functions.map(f => f.fullyQualifiedName)).values()];

    const resultSexpr = S(
      "[]", "module",
      S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
      S("[]", "import", '"js"', '"table"', S("[]", "table", String(functions.length), "anyfunc")),
      S("[]", "import", '"c"', '"log"',
        S("[]", "func", "$log", ...[...Array(12).keys()].map(_ => S("[]", "param", "i32")))
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
      ...namesToExport.map(fqname => S.Export(fqname)),

      // build our function table
      S("[]", "elem\n", S.Const(0),
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
