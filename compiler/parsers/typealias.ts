import { TypeAliasDeclaration } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";

export class BSTypeAliasDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Context, node: TypeAliasDeclaration) {
    super(ctx, node);
  }

  compile(ctx: Context): null {
    return null;
  }
}
