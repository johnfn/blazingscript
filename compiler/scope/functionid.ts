import { Type, SyntaxKind, MethodSignature, Identifier, InterfaceDeclaration, MethodDeclaration, FunctionDeclaration, DeclarationStatement } from "typescript";
import { Constants } from "../constants";

type Id = {
  type      : "normal declaration"
  fnName    : string;
  sourceFile: string;
  start     : number;
} | {
  type      : "library declaration";
  sourceFile: string;
  fnName    : string;
};

export class FunctionId {
  id: Id;

  constructor(type: Type) {
    let id: Id;

    id = {
      type      : "normal declaration",
      sourceFile: type.symbol.valueDeclaration.getSourceFile().fileName,
      start     : type.symbol.valueDeclaration.getStart(),
      fnName    : this.getNameOfFunctionLike(type),
    };

    /** 
     * TypeScript declarations will lead the definitions of our standard library
     * functions to our library definition file, which, while accurate, is not
     * very helpful for us when we want to get the actual locations of those
     * files. So we rewrite the declaration locations to be where the functions
     * are actually implemented.
     */
    if (type.symbol.valueDeclaration.getSourceFile().fileName === Constants.LIB_FILE) {
      if (type.symbol.valueDeclaration.kind === SyntaxKind.MethodSignature) {

        /**
         * Get method name.
         */

        const md = type.symbol.valueDeclaration as MethodSignature;
        const propIdentifier = md.name;
        let fnName: string;

        if (propIdentifier.kind === SyntaxKind.Identifier) {
          const identifier = propIdentifier as Identifier;

          fnName = identifier.text;
        } else {
          throw new Error("I don't handle methods with weird name types.");
        }

        /**
         * Get method source file.
         */

        const parent = type.symbol.valueDeclaration.parent;
        let sourceFile: string;

        if (parent.kind === SyntaxKind.InterfaceDeclaration) {
          const interfaceNode = parent as InterfaceDeclaration;

          if (interfaceNode.name.text === "String") {
            sourceFile = Constants.STRING_LIB_FILE;
          } else if (interfaceNode.name.text === "Array") {
            sourceFile = Constants.ARRAY_LIB_FILE;
          } else {
            console.log(type.symbol.valueDeclaration.getText());

            throw new Error("Unhandled library function interface name (expected String or Array).");
          }
        } else {
          throw new Error("Unhandled library function parent type.");
        }

        id = {
          type      : "library declaration",
          sourceFile,
          fnName    ,
        }
      } else {
        throw new Error("Unhandled library function child type.");
      }
    }

    this.id = id;
  }

  eq(id2: FunctionId): boolean {
    if (this.id.type === "normal declaration" && id2.id.type === "normal declaration") {
      return (
        this.id.sourceFile === id2.id.sourceFile && 
        this.id.start      === id2.id.start
      );
    } 
    
    if (this.id.type === "library declaration" && id2.id.type === "library declaration") {
      return (
        this.id.sourceFile === id2.id.sourceFile && 
        this.id.fnName     === id2.id.fnName
      );
    }

    if (
      (this.id.type === "library declaration" && id2.id.type === "normal declaration") ||
      (this.id.type === "normal declaration"  && id2.id.type === "library declaration")
    ) {
      // written in stupid way to appease type checker.

      const lib = (this.id.type === "library declaration" ? this.id : (id2.id.type === "library declaration" ? id2.id : undefined))!;
      const nor = (this.id.type === "normal declaration"  ? this.id : (id2.id.type === "normal declaration" ? id2.id : undefined))!;

      return (
        lib.fnName     === nor.fnName && 
        lib.sourceFile === nor.sourceFile
      );
    }

    return false;
  }

  private getNameOfFunctionLike(type: Type): string {
    const declaration = type.symbol.valueDeclaration;

    if (type.symbol.valueDeclaration.kind === SyntaxKind.FunctionDeclaration) {
      const fd = declaration as FunctionDeclaration;

      return fd.name ? fd.name.text : "anonymous_function";
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.ArrowFunction) {
      return "arrow_function";
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.MethodDeclaration) {
      const md = declaration as MethodDeclaration;
      const propIdentifier = md.name;

      if (propIdentifier.kind === SyntaxKind.Identifier) {
        const identifier = propIdentifier as Identifier;

        return identifier.text;
      } else {
        throw new Error("I don't handle methods with weird name types.");
      }
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.DeclareKeyword) {
      const decl = declaration as DeclarationStatement;
      const declIdentifier = decl.name;

      if (declIdentifier && declIdentifier.kind === SyntaxKind.Identifier) {
        const identifier = declIdentifier as Identifier;

        return identifier.text;
      } else {
        throw new Error("I don't handle declarations with weird name types.");
      }
    } else if (type.symbol.valueDeclaration.kind === SyntaxKind.MethodSignature) {
      const md = declaration as MethodSignature;
      const propIdentifier = md.name;

      if (propIdentifier.kind === SyntaxKind.Identifier) {
        const identifier = propIdentifier as Identifier;

        return identifier.text;
      } else {
        throw new Error("I don't handle methods with weird name types.");
      }
    } else {
      console.log(type.symbol.valueDeclaration.kind);
      console.log(type.symbol.valueDeclaration.getText());

      throw new Error("Couldnt get name of that function.");
    }
  }

}