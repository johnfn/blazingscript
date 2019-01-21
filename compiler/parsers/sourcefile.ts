import { SourceFile, SyntaxKind, FunctionDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../program";
import { parseStatementList } from "./statementlist";

export function parseSourceFile(ctx: Context, sf: SourceFile): Sexpr {
  // find all exported functions

  const exportedFunctions: string[] = [];

  for (const statement of sf.statements) {
    if (statement.kind === SyntaxKind.FunctionDeclaration) {
      const fd = statement as FunctionDeclaration;
      const name = fd.name && fd.name.getText();

      if (name) {
        exportedFunctions.push(name)
      } else {
        throw new Error("unnamed functions are not supported.");
      }
    }
  }

  return S(
    "[]",
    "module",
    S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
    S("[]", "import", '"console"', '"log"', S("[]", "func", "$log", S("[]", "param", "i32"))),
    S("[]", "import", '"c"', '"log"', 
      S("[]", "func", "$clog", ...[...Array(9).keys()].map(_ => S("[]", "param", "i32"))
    )),
    ...parseStatementList(ctx, sf.statements),
    ...(
      exportedFunctions.map(fnname => S.Export(fnname, "func"))
    )
  );
}
