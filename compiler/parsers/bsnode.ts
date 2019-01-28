import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { Node, Type } from "typescript";

/**
 * Abstract base class of all BlazingScript nodes.
 */
export abstract class BSNode {
  abstract children: BSNode[];
  tsType: Type;

  constructor(ctx: Context, node: Node) {
    if (node.parent) {
      this.tsType = ctx.typeChecker.getTypeAtLocation(node);
    } else {
      // TODO: SHould handle this better.
      this.tsType = undefined as any;
    }
  }

  forEachChild(callback: (node: BSNode) => void): void {
    for (const child of this.children) {
      callback(child);
    }
  }

  abstract compile(ctx: Context): Sexpr | null;
}
