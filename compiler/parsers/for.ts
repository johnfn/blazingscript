import { Context } from "../context";
import {
  ForStatement,
  SyntaxKind,
  VariableDeclarationList,
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { BSStatement } from "./statement";
import { BSVariableDeclarationList } from "./variabledeclarationlist";
import { BSNode } from "./bsnode";
import { getExpressionNode, BSExpression } from "./expression";
import { buildNode } from "./nodeutil";

/**
 * e.g. for (let x = 1; x < 5; x += 1) { console.log("hello"); }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSForStatement extends BSNode {
  children: BSNode[];

  initializer: BSVariableDeclarationList | BSExpression | null;
  incrementor: BSNode | null;
  condition: BSExpression | null;
  body: BSStatement | null;

  constructor(ctx: Context, node: ForStatement) {
    super(ctx, node);

    if (node.initializer === undefined) {
      this.initializer = null;
    } else if (node.initializer.kind === SyntaxKind.VariableDeclarationList) {
      this.initializer = new BSVariableDeclarationList(
        ctx,
        node.initializer as VariableDeclarationList
      );
    } else {
      this.initializer = buildNode(ctx, node.initializer);
    }

    if (node.incrementor === undefined) {
      this.incrementor = null;
    } else {
      this.incrementor = buildNode(ctx, node.incrementor);
    }

    if (node.condition === undefined) {
      this.condition = null;
    } else {
      this.condition = buildNode(ctx, node.condition);
    }

    this.body = new BSStatement(ctx, node.statement);

    this.children = [
      ...(this.initializer ? [this.initializer] : []),
      ...(this.incrementor ? [this.incrementor] : []),
      ...(this.condition ? [this.condition] : []),

      this.body
    ];
  }


  compile(ctx: Context): Sexpr {
    const initializerSexprs: Sexpr[] = [];

    if (this.initializer) {
      if (this.initializer instanceof BSVariableDeclarationList) {
        for (const v of this.initializer.declarations) {
          if (v.initializer) {
            initializerSexprs.push(
              S.SetLocal(v.nameNode.text, v.initializer.compile(ctx))
            );
          }
        }
      } else {
        initializerSexprs.push(this.initializer.compile(ctx));
      }
    }

    const inc = this.incrementor ? this.incrementor.compile(ctx) : null;

    // TODO - we generate an increment with every continue statement. im sure
    // there's a better way!

    ctx.scope.addLoop(inc);

    const bodyComp = this.body ? this.body.compile(ctx) : null;
    const cond = this.condition ? this.condition.compile(ctx) : null;

    const result = S(
      "i32",
      "block",
      ctx.scope.getLoopBreakLabel(),
      ...initializerSexprs,
      S(
        "[]",
        "loop",
        ctx.scope.getLoopContinueLabel(),
        ...(cond
          ? [S("[]", "br_if", ctx.scope.getLoopBreakLabel(), S("i32", "i32.eqz", cond))]
          : []),
        ...(bodyComp ? [bodyComp] : []),
        ...(inc ? [inc] : []),
        S("[]", "br", ctx.scope.getLoopContinueLabel())
      )
    );

    ctx.scope.popLoop();

    return result;
  }
}