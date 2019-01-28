import { VariableDeclarationList } from "typescript";
import { BSVariableDeclaration } from "./variabledeclaration";
import { BSNode } from "./bsnode";
import { Context } from "../context";

export class BSVariableDeclarationList extends BSNode {
  children: BSNode[];
  declarations: BSVariableDeclaration[];

  constructor(ctx: Context, node: VariableDeclarationList) {
    super(ctx, node);

    this.declarations = node.declarations.map(
      decl => new BSVariableDeclaration(ctx, decl)
    );

    this.children = this.declarations;
  }

  compile(ctx: Context): null {
    throw new Error("cant compile variable declaration lists!");
  }
}
