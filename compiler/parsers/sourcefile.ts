import {
  SourceFile,
  SyntaxKind,
  ClassDeclaration,
  CallExpression,
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "./statementlist";
import { Context } from "../context";
import { BSFunctionDeclaration } from "./function";
import { BSMethodDeclaration } from "./method";
import { BSStatement } from "./statement";
import { BSNode } from "./bsnode";
import { BSClassDeclaration } from "./class";

type FunctionDecl = {
  node: BSFunctionDeclaration | BSMethodDeclaration;

  /**
   * The containing class (if there is one).
   */
  parent: ClassDeclaration | null;
  name: string;
  exported: boolean;
};

export class BSSourceFile extends BSNode {
  children         : BSNode[];
  statements       : BSStatement[];

  fileName         : string;
  declaredFunctions: FunctionDecl[];
  jsTypes          : { [jsType: string]: string };

  constructor(ctx: Context, file: SourceFile) {
    super(ctx, file);

    this.fileName = file.fileName;
    this.statements = [...file.statements].map(
      statement => new BSStatement(ctx, statement)
    );
    this.children = this.statements;

    this.declaredFunctions = this.findAllFunctions();
    this.jsTypes = this.findAllJsTypes();
  }

  private findAllFunctions(): FunctionDecl[] {
    const decls: FunctionDecl[] = [];
    let parent : BSClassDeclaration | null = null;

    const helper = (node: BSNode) => {
      if (node instanceof BSFunctionDeclaration) {
        if (!node.name) {
          throw new Error(
            `dont handle anonymous functions yet: ${node.fullText}`
          );
        }

        // TODO: move this to constructor?

        decls.push({
          node: node,
          name: node.name,
          exported: true, //  fd.modifiers && fd.modifiers.find(tok => tok.kind === SyntaxKind.Export) .indexOf(ModifierFlags.Export) > -1
          parent: parent ? parent.nodeREMOVE : null
        });
      }

      if (node instanceof BSMethodDeclaration) {
        if (!node.name) {
          throw new Error(
            `dont handle anonymous functions yet: ${node.fullText}`
          );
        }

        decls.push({
          node: node,
          name: node.name,
          exported: false,
          parent: parent ? parent.nodeREMOVE : null
        });
      }

      const oldParent = parent;

      if (node instanceof BSClassDeclaration) {
        parent = node;
      }

      node.forEachChild(helper);

      parent = oldParent;
    };

    this.forEachChild(helper);

    return decls;
  }

  private findAllJsTypes(): { [jsType: string]: string } {
    const jsTypes: { [jsType: string]: string } = {};

    const helper = (node: BSNode) => {
      if (node instanceof BSClassDeclaration) {
        if (!node.name) {
          throw new Error(
            "dont handle decorators on unnamed classes currently!"
          );
        }

        for (const deco of node.nodeREMOVE.decorators || []) {
          if (deco.expression.kind === SyntaxKind.CallExpression) {
            const ce = deco.expression as CallExpression;

            if (ce.expression.getText() === "jsType") {
              const jsTypeName: string = ce.arguments[0].getText().slice(1, -1);

              jsTypes[jsTypeName] = node.name;
            }
          }
        }
      }

      node.forEachChild(helper);
    };

    this.forEachChild(helper);

    return jsTypes;
  }

  compile(ctx: Context): Sexpr {
    const functions = this.declaredFunctions;
    const exportedFunctions = functions.filter(f => f.exported);
    const jsTypes = this.jsTypes;

    ctx.addJsTypes(jsTypes);

    return S(
      "[]",
      "module",
      S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
      S(
        "[]",
        "import",
        '"c"',
        '"log"',
        S(
          "[]",
          "func",
          "$log",
          ...[...Array(9).keys()].map(_ => S("[]", "param", "i32"))
        )
      ),
      ...functions.map(fn => {
        if (fn.node instanceof BSFunctionDeclaration) {
          return fn.node.compile(ctx);
        } else if (fn.node instanceof BSMethodDeclaration) {
          return fn.node.compile(ctx);
        } 

        throw new Error("i got some weird type of function i cant handle.");
      }),
      ...parseStatementListBS(ctx, this.statements),
      ...exportedFunctions.map(fn => S.Export(fn.name, "func"))
    );
  }
}
