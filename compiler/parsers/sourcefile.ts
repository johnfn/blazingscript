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

  compile(ctx: Scope): Sexpr[] {
    const functions = ctx.functions.getAll(ctx.topmostScope()).sort((a, b) => a.tableIndex - b.tableIndex);

    const jsTypes = this.findAllJsTypes();
    ctx.addJsTypes(jsTypes);

    for (const statement of this.statements) {
      statement.compile(ctx);
    }

    return functions.map(fn => {
      return fn.node.getDeclaration();
    });
  }
}
