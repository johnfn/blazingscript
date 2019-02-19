import ts, { Node, ModuleKind, ScriptTarget, SourceFile, SyntaxKind, ClassDeclaration, CallExpression, Identifier, StringLiteral } from "typescript";
import fs from "fs";
import path, { parse } from "path";
import { sexprToString, Sexpr, S } from "./sexpr";
import { Scope, ScopeName } from "./scope/scope";
import { BSSourceFile } from "./parsers/sourcefile";
import { Functions, Operator } from "./scope/functions";
import { flatten } from "./rewriter";

export type NativeClasses = { [key: string]: ClassDeclaration };

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

  /**
   * returns the declarations of StringImpl, ArrayImpl etc.
   */
  private findAllNativeClassImplementations(sourceFiles: SourceFile[]): NativeClasses {
    const result: { [key: string]: ClassDeclaration } = {};

    for (const file of sourceFiles) {
      for (const statement of file.statements) {
        if (statement.kind === SyntaxKind.ClassDeclaration) {
          const classDecl = statement as ClassDeclaration;
          const decorators = classDecl.decorators;

          if (!decorators) { continue; }

          for (const deco of decorators) {
            if (deco.expression.kind === SyntaxKind.CallExpression) {
              const callExpr = deco.expression as CallExpression;

              if (callExpr.expression.kind === SyntaxKind.Identifier) {
                const fnNameIdentifier = callExpr.expression as Identifier;

                if (fnNameIdentifier.text === "jsType") {
                  const firstArgument = callExpr.arguments[0];

                  if (firstArgument.kind === SyntaxKind.StringLiteral) {
                    const firstArgumentStr = firstArgument as StringLiteral;
                    const overrideType     = firstArgumentStr.text;

                    result[overrideType] = classDecl;
                  } else {
                    throw new Error("Um, this should never happen!!!");
                  }
                }
              }
            }
          }
        }
      }
    }

    return result;
  }

  parse(): string {
    const allFiles       : Sexpr[][] = [];
    const allContexts    : Scope[] = [];
    const allSourceFiles = this.paths.map(x => {
      const res = this.program.getSourceFile(x);

      if (!res) { throw new Error("Source file not found! BAD!"); }

      return res;
    });

    const nativeClasses = this.findAllNativeClassImplementations(allSourceFiles);

    // Find all implementations of library methods up front.

    const allFunctions = new Functions(this.typeChecker, nativeClasses)

    for (const source of allSourceFiles) {
      const scope = new Scope({
        tc        : this.typeChecker, 
        sourceFile: source, 
        functions : allFunctions,
        parent    : null, 
        scopeType : { type: ScopeName.SourceFile, sourceFile: source },
      });

      allFunctions.activeScope = scope;

      scope.addNativeClasses(nativeClasses);

      new BSSourceFile(scope, source).compile(scope);

      allContexts.push(scope);
    }

    // TODO - is this deduping even necessary?
    const allUnduplicatedNames = flatten(allFunctions.getAll().map(f => {
      if (f.isGeneric) {
        return f.supportedTypeParams.map(type => f.getFullyQualifiedName(type));
      } else {
        return [f.getFullyQualifiedName()];
      }
    }));

    const namesToExport = [...new Set(allUnduplicatedNames).values()];

    const functionTable = flatten(allFunctions.getAll().map(fn => {
      return fn.supportedTypeParams.map(param => ({
        index : fn.getTableIndex(param),
        fqname: fn.getFullyQualifiedName(param),
      }));
    })).sort((a, b) => a.index - b.index);

    const resultSexpr = S(
      "[]", "module",
      S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
      S("[]", "import", '"js"', '"table"', S("[]", "table", String(allFunctions.getAll().length), "anyfunc")),
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

      ...flatten(allFunctions.getAllNodes()),
      ...namesToExport.map(fqname => S.Export(fqname)),

      // build our function table
      S("[]", "elem\n", S.Const(0),
        ...functionTable.map(fn => {
          return `$${ fn.fqname } ;; ${ fn.index }\n`;
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
