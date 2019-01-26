import { Node, SourceFile, SyntaxKind, FunctionDeclaration, MethodDeclaration, forEachChild, NodeFlags, ModifierFlags, ClassDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementList } from "./statementlist";
import { Context } from "../program";
import { parseFunction } from "./function";
import { parseMethod } from "./method";
import { removeNull } from "../util";

type FunctionDecl = {
  node    : FunctionDeclaration | MethodDeclaration;

  /**
   * The containing class (if there is one).
   */
  parent  : ClassDeclaration | null;
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
        return parseMethod(ctx, fn.node, fn.parent!);
      } else if (fn.node.kind === SyntaxKind.FunctionDeclaration) {
        return parseFunction(ctx, fn.node)
      }

      throw new Error("i got some weird type of function i cant handle.")
    }),
    ...parseStatementList(ctx, sf.statements),
    ...(
      exportedFunctions.map(fn => S.Export(fn.name, "func"))
    )
  );
}

function findAllFunctions(node: Node): FunctionDecl[] {
  const decls: FunctionDecl[] = [];
  let parent: ClassDeclaration | null = null;

  const helper = (node: Node) => {
    if (node.kind === SyntaxKind.FunctionDeclaration) {
      const fd = node as FunctionDeclaration;

      if (!fd.name) {
        throw new Error(`dont handle anonymous functions yet: ${ node.getText() }`)
      }

      // TODO: Remove this special case when we can handle this sort of thing.

      if (fd.name.getText() !== "operator") {
        decls.push({
          node: fd,
          name: fd.name.getText(),
          exported: true, //  fd.modifiers && fd.modifiers.find(tok => tok.kind === SyntaxKind.Export) .indexOf(ModifierFlags.Export) > -1
          parent,
        });
      }
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
        parent,
      });
    }

    const oldParent = parent;

    if (node.kind === SyntaxKind.ClassDeclaration) {
      parent = node as ClassDeclaration;
    }

    forEachChild(node, helper);

    parent = oldParent;
  }

  forEachChild(node, helper);

  return decls;
}