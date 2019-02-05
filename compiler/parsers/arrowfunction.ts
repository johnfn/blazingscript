import { Block, BreakStatement, ArrowFunction, SyntaxKind, Expression } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { buildNode, buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";
import { BSParameter } from "./parameter";
import { BSBlock } from "./block";
import { BSExpression } from "./expression";

// TODO: Handle label.

/**
 * e.g. const x = (arg: number) => arg + 1;
 *                ^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSArrowFunction extends BSNode {
  children   : BSNode[] = [];
  parameters : BSParameter[];
  body       : BSBlock | BSExpression | null;
  declaration: Sexpr | null = null;

  constructor(ctx: Scope, node: ArrowFunction, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    ctx.addScopeFor(this);
    const childCtx = ctx.getChildScope(this); {
      this.body       = node.body.kind === SyntaxKind.Block
        ? buildNode(childCtx, node.body as Block)
        : buildNode(childCtx, node.body as Expression);
      this.parameters = buildNodeArray(childCtx, node.parameters);
      this.children   = flatArray(this.parameters, this.body);
    }

    // ctx.functions.addFunction(this);
  }

  readableName(): string {
    return "Arrow function";
  }


  compile(ctx: Scope): Sexpr {
    return S.Const(0);
  }

  compileDeclaration(parentCtx: Scope): Sexpr {
    // TODO - this is copied from function

    /*
    const ctx    = parentCtx.getChildScope(this)
    const params = ctx.getParameters(this.parameters);
    const sb     = parseStatementListBS(ctx, this.body!.children);

    let last: Sexpr | null = null;

    if (sb.length > 0) {
      last = sb[sb.length - 1];
    }

    const ret = last && last.type === "i32" ? undefined : S.Const(0);

    const result = S.Func({
      name: ctx.functions.getFunctionByNode(this).bsName,
      params: params,
      body: [
        ...ctx.variables.getAll({ wantParameters: false }).map(decl => S.DeclareLocal(decl)),
        ...sb,
        ...(ret ? [ret] : [])
      ]
    });
    */

    // return result;
    return S.Const(0);
  }

  getDeclaration(): Sexpr {
    if (this.declaration) {
      return this.declaration;
    }

    throw new Error("This BSArrowNode needs to be compiled before it has a declaration available.");
  }
}
