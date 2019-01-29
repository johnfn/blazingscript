import { BSIdentifier } from "./identifier";
import { BindingName, SyntaxKind } from "typescript";
import { Context } from "../context";

// TODO: Add pattern matching stuff in here

export type BSBindingName = BSIdentifier;

/**
 * e.g. const foo = 1 + 3
 *            ^^^  
 */
export function parseBindingNameNode(ctx: Context, node: BindingName): BSIdentifier {
  if (node.kind === SyntaxKind.Identifier) {
    return new BSIdentifier(ctx, node);
  } else {
    throw new Error("Dont handle that kind of variable binding pattern!")
  }
}