import { PropertyAccessExpression, TypeFlags } from "typescript";
import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { getExpressionNode, BSExpressionNode } from "./expression";

export class BSPropertyAccessExpression extends BSNode {
  children: BSNode[];
  expression: BSExpressionNode;
  name: string;
  nodeREMOVE: PropertyAccessExpression;

  constructor(ctx: Context, node: PropertyAccessExpression) {
    super(ctx, node);

    this.expression = getExpressionNode(ctx, node.expression);
    this.children = [this.expression];
    this.name = node.name.text;
    this.nodeREMOVE = node;
  }

  compile(ctx: Context): Sexpr {
    return parsePropertyAccess(ctx, this.nodeREMOVE);
  }
}

export function parsePropertyAccess(
  ctx: Context,
  pa: PropertyAccessExpression
): Sexpr {
  const expType = ctx.typeChecker.getTypeAtLocation(pa.expression);
  const property = pa.name.text;

  if (
    expType.flags & TypeFlags.StringLike ||
    expType.symbol.name === ctx.getNativeTypeName("String") // for this types
  ) {
    if (property === "length") {
      return ctx.callMethod({
        className: ctx.getNativeTypeName("String"),
        methodName: "strLen",
        thisExpr: getExpressionNode(ctx, pa.expression),
        argExprs: []
      });
    }
  }

  throw new Error(`Todo ${pa.getText()} ${expType.flags}`);

  // return S.Const("i32", Number(flt.text));
}
