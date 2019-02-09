import { Scope } from "../scope/scope";
import { ArrayLiteralExpression, Type, SignatureKind, TypeFlags } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
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

  constructor(ctx: Scope, node: ArrayLiteralExpression, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.children = flatArray(
      this.elements = buildNodeArray(ctx, node.elements)
    );

    ctx.variables.addOnce("array_temp", this.tsType, "i32");
    ctx.variables.addOnce("array_content_temp", this.tsType, "i32");
  }

  compile(ctx: Scope): Sexpr {
    const allocatedLength = 16;
    const elemSize = BSArrayLiteral.GetArrayElemSize(ctx, this.tsType);

    return S("i32", "block", S("[]", "result", "i32"),
      S.SetLocal("array_temp"        , S("i32", "call", "$file__malloc", S.Const(4               * 4))),
      S.SetLocal("array_content_temp", S("i32", "call", "$file__malloc", S.Const(allocatedLength * 4))),

      // store allocated length
      S.Store(ctx.variables.get("array_temp"), allocatedLength),

      // store length
      S.Store(S.Add(ctx.variables.get("array_temp"), 4), this.elements.length),

      // store element size (probably unnecessary)
      S.Store(S.Add(ctx.variables.get("array_temp"), 8), elemSize),

      // store content
      S.Store(S.Add(ctx.variables.get("array_temp"), 12), ctx.variables.get("array_content_temp")),

      ...(
        this.elements.map((elem, i) =>
          S.Store(
            S.Add(ctx.variables.get("array_content_temp"), i * 4),
            elem.compile(ctx)
          )
        )
      ),

      ctx.variables.get("array_temp")
    );
  }

  public static GetArrayElemSize(ctx: Scope, type: Type) {
    const typeArguments = [...(type as any).typeArguments] as Type[];

    if (typeArguments.length > 1) {
      throw new Error("Dont handle multidimensional arrays yet!")
    }

    if (typeArguments.length === 0) {
      throw new Error("That's not an array...")
    }

    const argName = ctx.typeChecker.typeToString(typeArguments[0]);

    if (argName === "number") {
      return 4;
    } else {
      throw new Error(`Unhandled array type ${ argName }`);
    }
  }
}

export function isArrayType(ctx: Scope, type: Type) {
  return (
    (type.symbol && type.symbol.name === "Array") ||
    (type.symbol && type.symbol.name === "ArrayInternal") ||
    (type.symbol && type.symbol.name === ctx.getNativeTypeName("Array"))
  );
}

export function isFunctionType(ctx: Scope, type: Type) {
  const stringType = ctx.typeChecker.typeToString(type);

  // TODO: I'm PRETTY sure there's a better way here.
  return stringType.startsWith("(") && stringType.includes("=>");
}