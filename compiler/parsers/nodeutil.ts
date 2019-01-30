import { BSDecorator } from "./decorator";
import { Decorator, Node, SyntaxKind, NodeArray, Block, ParameterDeclaration } from "typescript";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSBlock } from "./block";
import { BSParameter } from "./parameter";

export function buildNode(ctx: Context, obj: Decorator | undefined): BSDecorator | null;
export function buildNode(ctx: Context, obj: Block     | undefined): BSBlock | null;

export function buildNode(ctx: Context, obj: Node | undefined): BSNode | null {
  if (obj === undefined) { return null; }

  switch (obj.kind) {
    case SyntaxKind.Decorator: return new BSDecorator(ctx, obj as Decorator);
    case SyntaxKind.Block    : return new BSBlock(ctx, obj as Block);
  }

  throw new Error("Unhandled node in buildNode!")
}

export function buildNodeArray(ctx: Context, obj: NodeArray<Decorator>            | undefined): BSDecorator[];
export function buildNodeArray(ctx: Context, obj: NodeArray<ParameterDeclaration> | undefined): BSParameter[];
export function buildNodeArray(ctx: Context, obj: NodeArray<Node>                 | undefined): BSNode[] {
  if (obj === undefined) { return []; }
  if (obj.length === 0) { return []; }

  switch (obj[0].kind) {
    case SyntaxKind.Decorator: return obj.map(x => new BSDecorator(ctx, x as Decorator));
    case SyntaxKind.Parameter: return obj.map(x => new BSParameter(ctx, x as ParameterDeclaration));
  }

  throw new Error("Unhandled node in buildNodeArray!")
}