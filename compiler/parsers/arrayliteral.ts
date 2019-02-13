import { Scope } from "../scope/scope";
import { ArrayLiteralExpression, Type, SignatureKind, TypeFlags } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { flattenArray } from "../util";
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

  constructor(scope: Scope, node: ArrayLiteralExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.elements = buildNodeArray(scope, node.elements)
    );

    scope.variables.addOnce("array_temp", this.tsType, "i32");
    scope.variables.addOnce("array_content_temp", this.tsType, "i32");
  }

  compile(scope: Scope): Sexpr {
    const allocatedLength = 16;
    const elemSize = BSArrayLiteral.GetArrayElemSize(scope, this.tsType);

    return S("i32", "block", S("[]", "result", "i32"),
      S.SetLocal("array_temp"        , S("i32", "call", "$malloc__malloc", S.Const(4               * 4))),
      S.SetLocal("array_content_temp", S("i32", "call", "$malloc__malloc", S.Const(allocatedLength * 4))),

      // store allocated length
      S.Store(scope.variables.get("array_temp"), allocatedLength),

      // store length
      S.Store(S.Add(scope.variables.get("array_temp"), 4), this.elements.length),

      // store content
      S.Store(S.Add(scope.variables.get("array_temp"), 8), scope.variables.get("array_content_temp")),

      ...(
        this.elements.map((elem, i) =>
          S.Store(
            S.Add(scope.variables.get("array_content_temp"), i * 4),
            elem.compile(scope)
          )
        )
      ),

      scope.variables.get("array_temp")
    );
  }

  public static GetArrayElemSize(scope: Scope, type: Type) {
    const typeArguments = [...(type as any).typeArguments] as Type[];

    if (typeArguments.length > 1) {
      throw new Error("Dont handle multidimensional arrays yet!")
    }

    if (typeArguments.length === 0) {
      throw new Error("That's not an array...")
    }

    const argName = scope.typeChecker.typeToString(typeArguments[0]);

    if (argName === "number") {
      return 4;
    } else {
      throw new Error(`Unhandled array type ${ argName }`);
    }
  }
}

export function isArrayType(scope: Scope, type: Type) {
  return (
    (type.symbol && type.symbol.name === "Array") ||
    (type.symbol && type.symbol.name === "ArrayImpl") ||
    (type.symbol && type.symbol.name === scope.getNativeTypeName("Array"))
  );
}

/**
 * symbol has a much more useful Function flag, but symbol doesn't always exist for
 * some reason? e.g. on parameters
 */
export function isFunctionType(scope: Scope, type: Type) {
  const sigs = scope.typeChecker.getSignaturesOfType(type, SignatureKind.Call);

  return sigs.length > 0;
}