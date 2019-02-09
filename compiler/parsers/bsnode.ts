import { Sexpr } from "../sexpr";
import { Scope, Property } from "../scope/scope";
import { Node, Type, Modifier, SyntaxKind } from "typescript";

export type NodeInfo = {
  isLhs     ?: boolean;
  moduleName?: string;
};

export const defaultNodeInfo = Object.freeze({ isLhs: false, moduleName: "" });

let uid = 0;
export function getUid() { return ++uid; }

/**
 * Abstract base class of all BlazingScript nodes.
 */
export abstract class BSNode {
  abstract children: BSNode[];

  // Arguably this can be undefined for one type of node, but the mess of if()
  // is really not worth it.
  tsType          !: Type; 
  fullText         : string;
  modifiers        : Modifier[];
  uid              : number;
  property         : Property | null;

  /**
   * Line this token appears in the source file.
   */
  line: number;

  /**
   * Character this token appears in the source file.
   */
  char: number;

  constructor(ctx: Scope, node: Node, info: NodeInfo = defaultNodeInfo) {
    this.uid       = getUid();
    this.modifiers = [...(node.modifiers || [])];
    this.property  = null;

    if (node.parent) {
      if (node.kind !== SyntaxKind.ImportClause) {
        this.tsType = ctx.typeChecker.getTypeAtLocation(node);
      }
    } else {
      // TODO: SHould handle this better.
      this.tsType = undefined as any;
    }

    this.fullText = node.getFullText();

    if (!ctx.sourceFile) {
      throw new Error("no source file!");
    }

    const pos = ctx.sourceFile.getLineAndCharacterOfPosition(node.pos);

    this.line = pos.line;
    this.char = pos.character;
  }

  forEachChild(callback: (node: BSNode) => void): void {
    for (const child of this.children) {
      callback(child);
    }
  }

  readableName(): string { return "unimplemented"; }

  abstract compile(ctx: Scope): Sexpr | Sexpr[] | null;
}
