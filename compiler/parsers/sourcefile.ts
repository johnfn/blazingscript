import {
  SourceFile,
  SyntaxKind,
  ClassDeclaration,
  CallExpression,
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseStatementListBS } from "./statementlist";
import { Context } from "../scope/context";
import { BSFunctionDeclaration } from "./function";
import { BSMethodDeclaration } from "./method";
import { BSStatement } from "./statement";
import { BSNode } from "./bsnode";
import { BSClassDeclaration } from "./class";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { flatArray } from "../util";
import { buildNodeArray } from "./nodeutil";

type FunctionDecl = {
  node: BSFunctionDeclaration | BSMethodDeclaration;

  /**
   * The containing class (if there is one).
   */
  parent  : BSClassDeclaration | null;
  name    : string;
  exported: boolean;
};

export class BSSourceFile extends BSNode {
  children         : BSNode[];
  statements       : BSStatement[];

  fileName         : string;
  jsTypes          : { [jsType: string]: string };

  constructor(ctx: Context, file: SourceFile) {
    super(ctx, file);

    this.fileName = file.fileName;

    this.children = flatArray(
      this.statements = buildNodeArray(ctx, file.statements)
    );

    this.jsTypes = this.findAllJsTypes();
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

        for (const deco of node.decorators) {
          if (deco.expression instanceof BSCallExpression) {
            if (deco.expression.expression instanceof BSIdentifier) {
              if (deco.expression.expression.text === "jsType") {
                const jsTypeName: string = deco.expression.arguments[0].fullText.slice(1, -1);

                jsTypes[jsTypeName] = node.name;
              }
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
    const functions         = ctx.getAllFunctions();
    const exportedFunctions = functions.filter(f => f.node instanceof BSFunctionDeclaration);
    const jsTypes           = this.jsTypes;

    // console.log(functions.map(x => x.bsname));

    ctx.addJsTypes(jsTypes);

    return S(
      "[]", "module",
      S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
      S("[]", "import", '"c"', '"log"',
        S("[]", "func", "$log", ...[...Array(9).keys()].map(_ => S("[]", "param", "i32")))
      ),
      ...functions.map(fn => {
        if (fn.node instanceof BSFunctionDeclaration) {
          return fn.node.compile(ctx);
        } else if (fn.node instanceof BSMethodDeclaration) {
          // TODO: Fix this up

          ctx.pushScopeFor(fn.node.parent);
          const result = fn.node.compile(ctx);
          ctx.popScope();

          return result;
        }

        throw new Error("i got some weird type of function i cant handle.");
      }),
      // ...parseStatementListBS(ctx, this.statements),
      ...exportedFunctions.map(fn => S.Export(fn.fnName))
    );
  }
}
