import { getExpressionNode, BSExpressionNode } from "./expression";
import { VariableDeclaration, BindingName, SyntaxKind } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { parseBindingNameNode, BSBindingName } from "./bindingname";

export class BSVariableDeclaration extends BSNode {
  children   : BSNode[];
  nameNode   : BSBindingName;
  name       : string;
  initializer: BSExpressionNode | null;

  constructor(ctx: Context, node: VariableDeclaration) {
    super(ctx, node);

    this.initializer = node.initializer
      ? getExpressionNode(ctx, node.initializer)
      : null;
    this.children = this.initializer ? [this.initializer] : [];
    
    this.nameNode = parseBindingNameNode(ctx, node.name);
    this.name = this.nameNode.text;
  }

  compile(ctx: Context): null {
    throw new Error("cant compile variable declarations!");
  }
}
