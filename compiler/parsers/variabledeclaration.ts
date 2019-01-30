import { BSExpression } from "./expression";
import { VariableDeclaration, BindingName, SyntaxKind } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { parseBindingNameNode, BSBindingName } from "./bindingname";
import { S, Sexpr } from "../sexpr";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";

export class BSVariableDeclaration extends BSNode {
  children   : BSNode[];
  nameNode   : BSBindingName;
  name       : string;
  initializer: BSExpression | null;

  constructor(ctx: Context, node: VariableDeclaration) {
    super(ctx, node);

    this.children = flatArray(
      this.initializer = buildNode(ctx, node.initializer),
      this.nameNode    = parseBindingNameNode(ctx, node.name),
    );

    this.name = this.nameNode.text;
  }

  compile(ctx: Context): Sexpr {
    const name = this.name;

    return S.SetLocal(
      name,
      this.initializer
        ? this.initializer.compile(ctx)
        : S.Const(0)
    );
  }
}
