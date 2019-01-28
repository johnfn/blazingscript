import { InterfaceDeclaration } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";

export class BSInterfaceDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Context, node: InterfaceDeclaration) {
    super(ctx, node);
  }

  compile(ctx: Context): null {
    return null;
  }
}
