import { Scope } from "../scope/scope";
import { ArrayLiteralExpression, Type, SignatureKind, TypeFlags, TypeChecker } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { flattenArray } from "../util";
import { buildNodeArray } from "./nodeutil";
import { Program } from "../program";
import { Constants } from "../constants";

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

    scope.variables.addOnce("array_temp", "i32");
    scope.variables.addOnce("array_content_temp", "i32");
  }

  compile(scope: Scope): CompileResultExpr {
    return BSArrayLiteral.EmitArrayLiteral(scope, this.elements);
  }

  /** 
   * Creates an array and emits a pointer to that array. Note that this function
   * requires you to have add a variable valled array_temp to scope in your
   * constructor - e.g. 
   * scope.variables.addOnce("array_temp", this.tsType, "i32")
   */
  public static EmitArrayLiteral(scope: Scope, elements: BSExpression[]): CompileResultExpr {
    const allocatedLength = elements.length + 1;

    let functions: Sexpr[] = [];

    let result = S("i32", "block", S("[]", "result", "i32"),
      S.SetLocal("array_temp"        , S("i32", "call", "$malloc__malloc", S.Const(4               * 4))),
      S.SetLocal("array_content_temp", S("i32", "call", "$malloc__malloc", S.Const(allocatedLength * 4))),

      // store allocated length
      S.Store(scope.variables.get("array_temp"), allocatedLength),

      // store length
      S.Store(S.Add(scope.variables.get("array_temp"), 4), elements.length),

      // store content
      S.Store(S.Add(scope.variables.get("array_temp"), 8), scope.variables.get("array_content_temp")),

      ...(
          elements.map((elem, i) => {
            const compiled = elem.compile(scope);
            functions = functions.concat(compiled.functions);

            return S.Store(
              S.Add(scope.variables.get("array_content_temp"), i * 4),
              compiled.expr
            )
          }
        )
      ),

      scope.variables.get("array_temp")
    );

    return {
      expr: result,
      functions,
    }
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

export function isArrayType(type: Type) {
  const arrayImplClassname = Program.NativeClasses[Constants.NATIVE_ARRAY].name!.text;

  if (type.symbol) {
    return (
      type.symbol.name === Constants.NATIVE_ARRAY || 
      type.symbol.name === arrayImplClassname
    );
  } else {
    return false;
  }
}

/**
 * symbol has a much more useful Function flag, but symbol doesn't always exist for
 * some reason? e.g. on parameters
 */
export function isFunctionType(scope: Scope, type: Type) {
  const sigs = scope.typeChecker.getSignaturesOfType(type, SignatureKind.Call);

  return sigs.length > 0;
}