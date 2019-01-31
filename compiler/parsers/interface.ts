import { InterfaceDeclaration } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../scope/context";

/**
 * e.g. interface Foo { x: number }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSInterfaceDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(ctx: Context, node: InterfaceDeclaration) {
    super(ctx, node);
  }

  compile(ctx: Context): null {
    return null;
  }
}
