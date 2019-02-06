import { SourceFile } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSFunctionDeclaration } from "./function";
import { BSMethodDeclaration } from "./method";
import { BSStatement } from "./statement";
import { BSNode, defaultNodeInfo, NodeInfo } from "./bsnode";
import { BSClassDeclaration } from "./class";
import { BSCallExpression } from "./callexpression";
import { BSIdentifier } from "./identifier";
import { flatArray, assertNever } from "../util";
import { buildNodeArray } from "./nodeutil";
import { Functions } from "../scope/functions";
import { BSArrowFunction } from "./arrowfunction";

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

  constructor(ctx: Scope, file: SourceFile, info: NodeInfo = defaultNodeInfo) {
    super(ctx, file);

    this.fileName = file.fileName;

    this.children = flatArray(
      this.statements = buildNodeArray(ctx, file.statements)
    );
  }

  // TODO: This is the wrong way to do this.

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

  compile(ctx: Scope): Sexpr {
    const functions         = ctx.functions.getAll(ctx.topmostScope()).sort((a, b) => a.tableIndex - b.tableIndex);
    const exportedFunctions = functions.filter(f => f.node instanceof BSFunctionDeclaration);

    const jsTypes = this.findAllJsTypes();
    ctx.addJsTypes(jsTypes);

    const uniqueFunctionTypes: { [key: string]: boolean } = {};

    for (const fn of functions) {
      uniqueFunctionTypes[fn.signature.name] = true;
    }


    for (const statement of this.statements) {
      statement.compile(ctx);
    }

    return S(
      "[]", "module",
      S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
      S("[]", "import", '"js"', '"table"', S("[]", "table", String(functions.length), "anyfunc")),
      S("[]", "import", '"c"', '"log"',
        S("[]", "func", "$log", ...[...Array(9).keys()].map(_ => S("[]", "param", "i32")))
      ),
      ...Object.keys(Functions.AllSignatures).map(sigName => {
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

      ...functions.map(fn => {
        return fn.node.getDeclaration();
      }),
      ...exportedFunctions.map(fn => S.Export(fn.fullyQualifiedName)),
      S("[]", "elem", S.Const(0),
        ...functions.map(fn => {
          return `$${ fn.fullyQualifiedName } ;; ${ fn.tableIndex }\n`;
        })
      )
    );
  }
}
