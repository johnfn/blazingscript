import { BSExpression } from "./expression";
import { VariableDeclaration, TypeFlags } from "typescript";
import { BSNode } from "./bsnode";
import { Context } from "../context";
import { parseBindingNameNode, BSBindingName } from "./bindingname";
import { S, Sexpr } from "../sexpr";
import { buildNode } from "./nodeutil";
import { flatArray } from "../util";
import { isArrayType } from "./arrayliteral";

export class BSVariableDeclaration extends BSNode {
  children   : BSNode[];
  nameNode   : BSBindingName;
  name       : string;
  initializer: BSExpression | null;

  constructor(ctx: Context, node: VariableDeclaration) {
    super(ctx, node);

    this.children = flatArray(
      this.initializer = buildNode(ctx, node.initializer),
      this.nameNode    = parseBindingNameNode(ctx, node.name),
    );

    if (
      this.tsType.flags & TypeFlags.NumberLike ||
      this.tsType.flags & TypeFlags.StringLike ||
      isArrayType(ctx, this.tsType)
    ) {
      ctx.addVariableToScope({ name: this.nameNode.text, tsType: this.tsType, wasmType: "i32", isParameter: false });
    } else {
      throw new Error(`Do not know how to handle that type: ${ TypeFlags[this.tsType.flags] } for ${ this.fullText }`);
    }

    this.name = this.nameNode.text;
  }

  compile(ctx: Context): Sexpr {
    const name = this.name;

    return S.SetLocal(
      name,
      this.initializer
        ? this.initializer.compile(ctx)
        : S.Const(0)
    );
  }
}
