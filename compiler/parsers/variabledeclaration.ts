import { getExpressionNode, BSExpression } from "./expression";
import { VariableDeclaration, BindingName, SyntaxKind } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { parseBindingNameNode, BSBindingName } from "./bindingname";
import { S, Sexpr } from "../sexpr";

export class BSVariableDeclaration extends BSNode {
  children   : BSNode[];
  nameNode   : BSBindingName;
  name       : string;
  initializer: BSExpression | null;

  constructor(ctx: Context, node: VariableDeclaration) {
    super(ctx, node);

    this.initializer = node.initializer
      ? getExpressionNode(ctx, node.initializer)
      : null;
    
    this.nameNode = parseBindingNameNode(ctx, node.name);
    this.name     = this.nameNode.text;

    this.children = [
      ...(this.initializer ? [this.initializer] : []),
      this.nameNode,
    ];
  }

  compile(ctx: Context): Sexpr {
    const name = this.name;

    return S.SetLocal(
      name,
      this.initializer
        ? this.initializer.compile(ctx)
        : S.Const("i32", 0)
    );
  }
}
