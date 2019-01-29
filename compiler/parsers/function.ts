import { FunctionDeclaration } from "typescript";
import { Sexpr, Param, S } from "../sexpr";
import { Context } from "../context";
import { parseStatementList, parseStatementListBS } from "./statementlist";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSNode } from "./bsnode";

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

    this.body = node.body ? new BSBlock(ctx, node.body) : null;
    this.parameters = [...node.parameters].map(
      param => new BSParameter(ctx, param)
    );
    this.children = [...this.parameters, ...(this.body ? [this.body] : [])];

    this.name = node.name ? node.name.text : null;
    this.fullText = node.getFullText();
  }

  compile(ctx: Context): Sexpr {
    ctx.pushScope();

    ctx.addFunction(this);

    // Add local variables to scope.

    ctx.addDeclarationsToContext(this);

    // Build the function.

    const params = ctx.addParameterListToContext(this.parameters);
    const sb = parseStatementListBS(ctx, this.body!.children);
    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const("i32", 0);

    const result = S.Func({
      name: ctx.getFunctionByNode(this).bsname,
      params: params,
      body: [
        ...ctx
          .getVariablesInCurrentScope(false)
          .map(decl => S.DeclareLocal(decl.bsname, decl.wasmType)),
        ...sb,
        ...(ret ? [ret] : [])
      ]
    });

    ctx.popScope();

    return result;
  }
}
