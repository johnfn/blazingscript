import { Context } from "../context";
import { ForStatement, SyntaxKind, VariableDeclarationList, validateLocaleAndSetLanguage } from "typescript";
import { Sexpr, S } from "../sexpr";
import { parseExpression, BSExpression } from "./expression";
import { parseStatement, BSStatement } from "./statement";
import { BSNode } from "../rewriter";
import { BSVariableDeclarationList } from "./variabledeclarationlist";

export class BSForStatement extends BSNode {
  children   : BSNode[];

  initializer: BSVariableDeclarationList | BSExpression | null;
  incrementor: BSExpression | null;
  condition  : BSExpression | null;
  body       : BSStatement  | null;

  constructor(node: ForStatement) {
    super();

    if (node.initializer === undefined) {
      this.initializer = null;
    } else if (node.initializer.kind === SyntaxKind.VariableDeclarationList) {
      this.initializer = new BSVariableDeclarationList(node.initializer as VariableDeclarationList);
    } else {
      this.initializer = new BSExpression(node.initializer);
    }

    if (node.incrementor === undefined) {
      this.incrementor = null;
    } else {
      this.incrementor = new BSExpression(node.incrementor);
    }

    if (node.condition === undefined) {
      this.condition = null;
    } else {
      this.condition = new BSExpression(node.condition);
    }

    this.body = new BSStatement(node.statement);

    this.children = [
      ...(this.initializer ? [this.initializer] : []),
      ...(this.incrementor ? [this.incrementor] : []),
      ...(this.condition   ? [this.condition  ] : []),

      this.body
    ];
  }
}

export function parseForStatement(ctx: Context, fs: ForStatement): Sexpr {
  const initializerSexprs: Sexpr[] = [];

  if (fs.initializer) {
    if (fs.initializer.kind === SyntaxKind.VariableDeclarationList) {
      const vdl = fs.initializer as VariableDeclarationList;

      for (const v of vdl.declarations) {
        if (v.initializer) {
          initializerSexprs.push(
            S.SetLocal(
              v.name.getText(),
              parseExpression(ctx, v.initializer)
            )
          );
        }
      }
    } else {
      initializerSexprs.push(parseExpression(ctx, fs.initializer));
    }
  }

  const inc = fs.incrementor ? parseExpression(ctx, fs.incrementor) : null;

  // TODO - we generate an increment with every continue statement. im sure
  // there's a better way!

  ctx.addToLoopStack(inc);

  const body = parseStatement(ctx, fs.statement);
  const cond = fs.condition ? parseExpression(ctx, fs.condition) : null;

  const result = S(
    "i32",
    "block", ctx.getLoopBreakLabel(),
    ...initializerSexprs,
    S("[]", "loop", ctx.getLoopContinueLabel(),
      ...(cond ? [
        S("[]", "br_if", ctx.getLoopBreakLabel(), S("i32", "i32.eqz", cond))
      ] : []),
      ...(body ? [body] : []),
      ...(inc  ? [inc] : []),
      S("[]", "br", ctx.getLoopContinueLabel()),
    )
  );

  ctx.popFromLoopStack();

  return result;
}
