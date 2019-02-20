import { Type, TypeFlags, SyntaxKind, ClassDeclaration, CallExpression, Identifier, StringLiteral, Declaration, MethodDeclaration, FunctionDeclaration, InterfaceDeclaration, SymbolFlags, TypeChecker } from "typescript";
import { isArrayType } from "./parsers/arrayliteral";
import { NativeClasses } from "./program";
import { Constants } from "./constants";
import { Operator } from "./scope/functions";

export type DecoratorArgument = {
  type : "string";
  value: string;
};

export type Decorator = {
  name     : string;
  arguments: DecoratorArgument[];
};

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

  public static GetFunctionDeclaration(type: Type, checker: TypeChecker, nativeClasses: NativeClasses): MethodDeclaration | FunctionDeclaration {
    const declaration = type.symbol.valueDeclaration;

    if (declaration.kind === SyntaxKind.FunctionDeclaration) {
      return declaration as FunctionDeclaration;
    } else if (declaration.kind === SyntaxKind.MethodDeclaration) {
      return declaration as MethodDeclaration;
    } else if (declaration.kind === SyntaxKind.MethodSignature) {
      const parent = declaration.parent;

      if (parent.kind === SyntaxKind.InterfaceDeclaration) {
        const interfaceDecl = parent as InterfaceDeclaration;
        const name = interfaceDecl.name.text;
        const classDecl = nativeClasses[name];
        const instanceType = checker.getTypeAtLocation(classDecl);
        const properties = checker.getPropertiesOfType(instanceType);

        for (const prop of properties) {
          const decl = prop.valueDeclaration;

          if (prop.flags & SymbolFlags.Method) {
            if (prop.name === type.symbol.name) {
              return decl as MethodDeclaration;
            }
          }
        }

        throw new Error("Method not found on class.");
      } else {
        throw new Error("unhandled parent type (not interace)");
      }
    } else {
      throw new Error("Unknown method type.");
    }
  }

}