import { Node, SourceFile, SyntaxKind, FunctionDeclaration, MethodDeclaration, forEachChild, NodeFlags, ModifierFlags } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementList } from "./statementlist";
import { Context } from "../program";
import { parseFunction } from "./function";

type FunctionDecl = {
  node    : FunctionDeclaration | MethodDeclaration;
  name    : string;
  exported: boolean;
}

export function parseSourceFile(ctx: Context, sf: SourceFile): Sexpr {
  // find all exported functions

  const functions = findAllFunctions(sf);
  const exportedFunctions = functions.filter(f => f.exported);

  return S(
    "[]",
    "module",
    S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
    S("[]", "import", '"console"', '"log"', S("[]", "func", "$log", S("[]", "param", "i32"))),
    S("[]", "import", '"c"', '"log"', 
      S("[]", "func", "$clog", ...[...Array(9).keys()].map(_ => S("[]", "param", "i32"))
    )),
    ...functions.map(fn => { 
      if (fn.node.kind === SyntaxKind.MethodDeclaration) {
        // return parseMethod(ctx, fn.node);
      } else if (fn.node.kind === SyntaxKind.FunctionDeclaration) {
        return parseFunction(ctx, fn.node)
      }

      throw new Error("i dont handle methods yet (or whatever else i got here.)")
    }),
    ...parseStatementList(ctx, sf.statements),
    ...(
      exportedFunctions.map(fn => S.Export(fn.name, "func"))
    )
  );
}

function findAllFunctions(node: Node): FunctionDecl[] {
  const decls: FunctionDecl[] = [];

  const helper = (node: Node) => {
    if (node.kind === SyntaxKind.FunctionDeclaration) {
      const fd = node as FunctionDeclaration;

      if (!fd.name) {
        throw new Error(`dont handle anonymous functions yet: ${ node.getText() }`)
      }

      decls.push({
        node: fd,
        name: fd.name.getText(),
        exported: true, //  fd.modifiers && fd.modifiers.find(tok => tok.kind === SyntaxKind.Export) .indexOf(ModifierFlags.Export) > -1
      });
    }

    if (node.kind === SyntaxKind.MethodDeclaration) {
      const md = node as MethodDeclaration;

      if (!md.name) {
        throw new Error(`dont handle anonymous functions yet: ${ node.getText() }`)
      }

      decls.push({
        node: md,
        name: md.name.getText(),
        exported: false,
      });
    }

    forEachChild(node, helper);
  }

  forEachChild(node, helper);

  return decls;
}