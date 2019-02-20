import { Type, TypeFlags, SyntaxKind, ClassDeclaration } from "typescript";
import { isArrayType } from "./parsers/arrayliteral";
import { NativeClasses } from "./program";
import { Constants } from "./constants";

export class AstUtil {
  public static GetParentClassOfMethod(type: Type, nativeClasses: NativeClasses): ClassDeclaration {
    if (type.flags & TypeFlags.StringLike) {
      return nativeClasses[Constants.NATIVE_STRING];
    }

    if (isArrayType(type)) {
      return nativeClasses[Constants.NATIVE_ARRAY];
    }

    const methodDecl = type.symbol.valueDeclaration;
    const parent = methodDecl.parent;

    if (parent.kind === SyntaxKind.ClassDeclaration) {
      const classDecl = parent as ClassDeclaration;

      if (!classDecl.name) { throw new Error("Anonymous classes not supported."); }

      return classDecl;
    } else {
      throw new Error("couldn't find a class for provided type. it might not be a method.");
    }
  }

}