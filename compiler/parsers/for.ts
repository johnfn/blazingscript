import { Scope } from "../scope/scope";
import {
  ForStatement,
  SyntaxKind,
  VariableDeclarationList,
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { BSStatement } from "./statement";
import { BSVariableDeclarationList } from "./variabledeclarationlist";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";

/**
 * e.g. for (let x = 1; x < 5; x += 1) { myFunction("hello"); }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSForStatement extends BSNode {
  children: BSNode[];

  initializer: BSVariableDeclarationList | BSExpression | null;
  incrementor: BSExpression | null;
  condition  : BSExpression | null;
  body       : BSStatement | null;

  constructor(ctx: Scope, node: ForStatement, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.initializer = buildNode(ctx, node.initializer);
    this.incrementor = buildNode(ctx, node.incrementor);
    this.condition   = buildNode(ctx, node.condition);
    this.body        = buildNode(ctx, node.statement);

    this.children = [
      ...(this.initializer ? [this.initializer] : []),
      ...(this.incrementor ? [this.incrementor] : []),
      ...(this.condition   ? [this.condition]   : []),
      ...(this.body        ? [this.body]        : []),
    ];
  }

  compile(ctx: Scope): Sexpr {
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

    ctx.loops.add(inc);

    const bodyComp = this.body ? this.body.compile(ctx) : null;
    const cond = this.condition ? this.condition.compile(ctx) : null;

    const result = S(
      "i32",
      "block",
      ctx.loops.getBreakLabel(),
      ...initializerSexprs,
      S(
        "[]",
        "loop",
        ctx.loops.getContinueLabel(),
        ...(cond
          ? [S("[]", "br_if", ctx.loops.getBreakLabel(), S("i32", "i32.eqz", cond))]
          : []),
        ...(bodyComp ? [bodyComp] : []),
        ...(inc ? [inc] : []),
        S("[]", "br", ctx.loops.getContinueLabel())
      )
    );

    ctx.loops.pop();

    return result;
  }
}