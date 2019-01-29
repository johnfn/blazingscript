import {
  ClassDeclaration,
  SyntaxKind,
  MethodDeclaration,
  PropertyDeclaration
} from "typescript";
import { Context } from "../context";
import { BSNode } from "./bsnode";
import { BSMethodDeclaration } from "./method";
import { BSPropertyDeclaration } from "./propertydeclaration";

export class BSClassDeclaration extends BSNode {
  children: BSNode[];
  members: BSNode[];

  name: string;
  nodeREMOVE: ClassDeclaration;

  constructor(ctx: Context, node: ClassDeclaration) {
    super(ctx, node);

    this.nodeREMOVE = node;

    this.members = [...node.members].map(mem => {
      if (mem.kind === SyntaxKind.MethodDeclaration) {
        return new BSMethodDeclaration(ctx, mem as MethodDeclaration, this.nodeREMOVE);
      } else if (mem.kind === SyntaxKind.PropertyDeclaration) {
        return new BSPropertyDeclaration(ctx, mem as PropertyDeclaration);
      } else {
        console.log(mem.kind);

        throw new Error("Dont handle other things in classes yet.");
      }
    });
    this.children = [...this.members];

    if (node.name) {
      this.name = node.name.text;
    } else {
      throw new Error("Dont currently handle anonymous functions.");
    }
  }

  compile(ctx: Context): null {
    return null;
  }
}
