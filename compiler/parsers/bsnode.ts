import { Sexpr } from "../sexpr";
import { Context } from "../context";
import { Node, Type, Modifier } from "typescript";

let uid = 0;
export function getUid() { return ++uid; }

/**
 * Abstract base class of all BlazingScript nodes.
 */
export abstract class BSNode {
  abstract children: BSNode[];
  tsType           : Type;
  fullText         : string;
  modifiers        : Modifier[];
  uid              : number;

  constructor(ctx: Context, node: Node) {
    this.uid = getUid();
    this.modifiers = [...(node.modifiers || [])];

    if (node.parent) {
      this.tsType = ctx.typeChecker.getTypeAtLocation(node);
    } else {
      // TODO: SHould handle this better.
      this.tsType = undefined as any;
    }

    this.fullText = node.getFullText();
  }

  forEachChild(callback: (node: BSNode) => void): void {
    for (const child of this.children) {
      callback(child);
    }
  }

  readableName(): string { return "unimplemented"; }

  abstract compile(ctx: Context): Sexpr | null;
}
