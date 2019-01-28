import { getExpressionNode, BSExpressionNode } from "./expression";
import { VariableDeclaration, BindingName, SyntaxKind } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { BSIdentifier } from "./identifier";

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

// TODO: Add pattern matching stuff in here

type BSBindingName = BSIdentifier;

function parseBindingNameNode(ctx: Context, node: BindingName): BSIdentifier {
  if (node.kind === SyntaxKind.Identifier) {
    return new BSIdentifier(ctx, node);
  } else {
    throw new Error("Dont handle that kind of variable binding pattern!")
  }
}
