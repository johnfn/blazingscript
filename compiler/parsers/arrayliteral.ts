import { Context } from "../context";
import { ArrayLiteralExpression, Type } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode } from "./bsnode";
import { BSExpression } from "./expression";
import { flatArray } from "../util";
import { buildNodeArray } from "./nodeutil";

/**
 * Memory layout:
 *
 * 0: length allocated of array
 * 1: length of array
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

    this.children = flatArray(
      this.elements = buildNodeArray(ctx, node.elements)
    );

    ctx.addVariableToScopeOnce("array_temp", this.tsType, "i32");
  }

  compile(ctx: Context): Sexpr {
    const allocatedLength = 16;

    return S("i32", "block", S("[]", "result", "i32"),
      S.SetLocal(
        "array_temp",
        S("i32", "call", "$malloc", S.Const(this.elements.length * 4 + 4))
      ),

      // store allocated length
      S.Store(ctx.getVariable("array_temp"), allocatedLength),

      // store length
      S.Store(S.Add(ctx.getVariable("array_temp"), 4), this.elements.length),

      ...(
        this.elements.map((elem, i) =>
          S.Store(
            S.Add(ctx.getVariable("array_temp"), i * 4 + 4 * 2),
            elem.compile(ctx)
          )
        )
      ),

      ctx.getVariable("array_temp")
    );
  }
}

export function isArrayType(ctx: Context, type: Type) {
  return (
    // TODO: i KNOW there is a better way here.
    ctx.typeChecker.typeToString(type) === "number[]" ||
    (type.symbol && type.symbol.name === ctx.getNativeTypeName("Array"))
  );
}