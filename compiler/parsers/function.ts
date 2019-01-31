import { FunctionDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { parseStatementListBS } from "./statementlist";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSNode } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. function myFn() { }
 *      ^^^^^^^^^^^^^^^^^^^
 */
export class BSFunctionDeclaration extends BSNode {
  children  : BSNode[];
  parameters: BSParameter[];
  body      : BSBlock | null;

  name      : string | null;
  fullText  : string;

  constructor(ctx: Context, node: FunctionDeclaration) {
    super(ctx, node);

    ctx.addScopeFor(this);
    ctx.pushScopeFor(this); {
      this.body       = buildNode(ctx, node.body);
      this.parameters = buildNodeArray(ctx, node.parameters);
      this.children   = flatArray(this.parameters, this.body);
      this.name       = node.name ? node.name.text : null;
      this.fullText   = node.getFullText();
    } ctx.popScope();

    ctx.addFunction(this);
  }

  compile(ctx: Context): Sexpr {
    ctx.pushScopeFor(this);

    const params = ctx.getParameters(this.parameters);
    const sb = parseStatementListBS(ctx, this.body!.children);

    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    const result = S.Func({
      name: ctx.getFunctionByNode(this).bsname,
      params: params,
      body: [
        ...ctx
          .getVariablesInCurrentScope({ wantParameters: false })
          .map(decl => S.DeclareLocal(decl)),
        ...sb,
        ...(ret ? [ret] : [])
      ]
    });

    ctx.popScope()

    return result;
  }

  readableName(): string {
    if (this.name) {
      return `function ${ this.name }`;
    } else {
      return "anonymous function";
    }
  }
}
