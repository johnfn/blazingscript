import { ClassDeclaration } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Context } from "../context";
import { BSNode } from "../rewriter";
import { BSClassElement } from "./classelement";

export class BSClassDeclaration extends BSNode {
  children: BSNode[];
  members: BSClassElement[];

  constructor(node: ClassDeclaration) {
    super();

    this.members = [...node.members].map(mem => new BSClassElement(mem));
    this.children = [
      ...this.members,
    ];
  }
}

export function parseClass(ctx: Context, statement: ClassDeclaration): Sexpr {
  return S("[]", "nop");
}
