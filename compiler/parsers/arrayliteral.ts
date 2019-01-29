import { Context } from "../context";
import { ArrayLiteralExpression, Type } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode } from "./bsnode";
import { BSExpression, getExpressionNode } from "./expression";

const enum ArrayType {
  ValueArray     = 0,
  ReferenceArray = 1,
}

/**
 * Memory layout:
 * 
 * 0: length of array
 * 1: type of element (either value or reference currently)
 * 2: first element
 * 3: second element, etc
 */

/**
 * e.g. const x = [1, 2, 3, 4]
 *                ^^^^^^^^^^^^
 */
export class BSArrayLiteral extends BSNode {
  children: BSNode[] = [];
  elements: BSExpression[] = [];

  constructor(ctx: Context, node: ArrayLiteralExpression) {
    super(ctx, node);

    this.elements = [...node.elements].map(el => getExpressionNode(ctx, el));
    this.children = [
      ...this.elements,
    ];
  }

  compile(ctx: Context): Sexpr {
    return S("i32", 
      "block",
      S("[]", "result", "i32"),

      S.SetLocal(
        "myalocal",
        S("i32", "call", "$malloc", S.Const("i32", this.elements.length * 4 + 4 + 4 + 4))
      ),

      // store length
      S.Store(ctx.getVariable("myalocal"), S.Const("i32", this.elements.length)),

      // store element type
      S.Store(
        S("i32", "i32.add", ctx.getVariable("myalocal"), S.Const("i32", 4 * 1)), 
        S.Const("i32", ArrayType.ValueArray)
      ),

      ...(
        this.elements.map((elem, i) => 
          S.Store(
            S.Add(ctx.getVariable("myalocal"), S.Const("i32", i * 4 + 4 * 2)),
            elem.compile(ctx)
          )
       )
      ),

      ctx.getVariable("myalocal")
    );
  }
}

export function isArrayType(ctx: Context, type: Type) {
  return (
    // TODO: i KNOW there is a better way here.
    ctx.typeChecker.typeToString(type) === "number[]" ||
    ctx.getNativeTypeName("String")
  );
}