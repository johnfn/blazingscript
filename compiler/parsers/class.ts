import {
  ClassDeclaration,
  SyntaxKind,
  MethodDeclaration,
  PropertyDeclaration
} from "typescript";
import { Scope } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSMethodDeclaration } from "./method";
import { BSPropertyDeclaration } from "./propertydeclaration";
import { BSDecorator } from "./decorator";
import { buildNodeArray } from "./nodeutil";
import { flatArray } from "../util";

/**
 * e.g. class MyClass { ... }
 *      ^^^^^^^^^^^^^^^^^^^^
 */
export class BSClassDeclaration extends BSNode {
  children  : BSNode[];
  members   : BSNode[];
  decorators: BSDecorator[];

  name: string;

  constructor(ctx: Scope, node: ClassDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    if (node.name) {
      this.name = node.name.text;
    } else {
      throw new Error("Dont currently handle anonymous functions.");
    }

    ctx.addScopeFor(this);
    const childCtx = ctx.getChildScope(this); {
      this.decorators = buildNodeArray(childCtx, node.decorators);
      this.members = [...node.members].map(mem => {
        if (mem.kind === SyntaxKind.MethodDeclaration) {
          return new BSMethodDeclaration(childCtx, mem as MethodDeclaration, this);
        } else if (mem.kind === SyntaxKind.PropertyDeclaration) {
          return new BSPropertyDeclaration(childCtx, mem as PropertyDeclaration);
        } else if (mem.kind === SyntaxKind.IndexSignature) {
          return null;
        } else {
          console.log(mem.kind);

          throw new Error("Dont handle other things in classes yet.");
        }
      }).filter(x => x) as BSNode[];

      this.children = flatArray(
        this.decorators,
        this.members,
      );
    }
  }

  readableName() {
    return `Class ${ this.name }`;
  }

  compile(ctx: Scope): null {
    return null;
  }
}
