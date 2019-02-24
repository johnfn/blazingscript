import { Node, Symbol, Type, TypeFlags, SyntaxKind, ClassDeclaration, CallExpression, Identifier, StringLiteral, Declaration, MethodDeclaration, FunctionDeclaration, InterfaceDeclaration, SymbolFlags, TypeChecker, PropertyDeclaration, PropertyAccessExpression } from "typescript";
import { isArrayType } from "./parsers/arrayliteral";
import { NativeClasses, Program } from "./program";
import { Constants } from "./constants";

export type DecoratorArgument = {
  type : "string";
  value: string;
};

export type Decorator = {
  name     : string;
  arguments: DecoratorArgument[];
};

export class AstUtil {
  /**
   * Finds the class declaration of the provided type.
   * 
   * string => StringImpl
   * [1, 2, 3] => ArrayImpl
   * "asdf".charAt => StringImpl
   */
  public static GetClassDeclarationOfMethod(checker: TypeChecker, symbol: Symbol): ClassDeclaration {
    const methodDecl = symbol.valueDeclaration;
    const parent = methodDecl.parent;

    if (parent.kind === SyntaxKind.ClassDeclaration) {
      const classDecl = parent as ClassDeclaration;

      if (!classDecl.name) { throw new Error("Anonymous classes not supported."); }

      return classDecl;
    } else {
      throw new Error("couldn't find a class for provided type. it might not be a method.");
    }
  }

  public static GetClassDeclarationOfType(type: Type): ClassDeclaration {
    if (type.flags & TypeFlags.StringLike) {
      return Program.NativeClasses[Constants.NATIVE_STRING];
    }

    if (isArrayType(type)) {
      return Program.NativeClasses[Constants.NATIVE_ARRAY];
    }

    if (Program.Checker.typeToString(type) === "this") {
      // Handle "this" type.

      // TODO: This is a bit of a hack. We are assuming that "this" refers to the
      // current class. However, if you subclass this class into a new class, and
      // call the method using "this", then this will not actually be true. I
      // should use proper type generics here, somehow.

      return type.symbol.valueDeclaration as ClassDeclaration;
    }

    throw new Error(`Cant find declaration of provided type! ${ Program.Checker.typeToString(type) }`);
  }

  /**
   * e.g. If node has type String, this will return type StringImpl.
   */
  public static GetClassTypeOfNode(node: Node): Type {
    const classType = Program.Checker.getTypeAtLocation(node);
    const classDecl = AstUtil.GetClassDeclarationOfType(classType);

    return Program.Checker.getTypeAtLocation(classDecl);
  }

  public static GetPropertyDeclaration(checker: TypeChecker, node: PropertyAccessExpression): PropertyDeclaration {
    const classType = AstUtil.GetClassTypeOfNode(node.expression);

    // TODO im pretty curious if i can get the symbol from here.

    const classProps = checker.getPropertiesOfType(classType);

    for (const classProp of classProps) {
      if (classProp.name === node.name.text) {
        return classProp.valueDeclaration as PropertyDeclaration;
      }
    }

    throw new Error("property not found on class!");
  }

  /*
  public static GetClassDeclarationOfProperty(checker: TypeChecker, symbol: Symbol): ClassDeclaration {
    const propDecl = symbol.valueDeclaration;
    const parent = propDecl.parent;

    if (parent.kind === SyntaxKind.ClassDeclaration) {
      const classDecl = parent as ClassDeclaration;

      if (!classDecl.name) { throw new Error("Anonymous classes not supported."); }

      return classDecl;
    } else if (parent.kind === SyntaxKind.InterfaceDeclaration) {
      const interfaceDecl = parent as InterfaceDeclaration;

      if (!interfaceDecl.name) { throw new Error("Anonymous classes not supported."); }

      const intName = interfaceDecl.name.text;

      if (intName in Program.NativeClasses) {
        return Program.NativeClasses[intName];
      }

      throw new Error(`dont handle generic interfaces: ${ interfaceDecl.name.text }.`);
    } else {
      throw new Error("couldn't find a class for provided type. it might not be a method.");
    }
  }
  */

  public static GetContainingClass(type: Type): ClassDeclaration {
    const decl      = type.symbol.valueDeclaration;
    const classDecl = decl.parent;

    return classDecl as ClassDeclaration;
  }

  public static GetFunctionDeclaration(type: Type, checker: TypeChecker): MethodDeclaration | FunctionDeclaration {
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
        const classDecl = Program.NativeClasses[name];
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