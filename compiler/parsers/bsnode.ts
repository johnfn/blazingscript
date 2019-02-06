import { Sexpr } from "../sexpr";
import { Scope, Property } from "../scope/scope";
import { Node, Type, Modifier } from "typescript";

export type NodeInfo = {
  isLhs: boolean;
};

export const defaultNodeInfo = Object.freeze({ isLhs: false });

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
  property         : Property | null;

  constructor(ctx: Scope, node: Node, info: NodeInfo = defaultNodeInfo) {
    this.uid       = getUid();
    this.modifiers = [...(node.modifiers || [])];
    this.property  = null;

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

  abstract compile(ctx: Scope): Sexpr | Sexpr[] | null;
}
