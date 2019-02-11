import ts, { Symbol, TypeFlags, Type, SourceFile, TypeChecker, SymbolFlags } from "typescript";
import { Param, WasmType } from "../sexpr";
import { BSParameter } from "../parsers/parameter";
import { BSForStatement } from "../parsers/for";
import { isArrayType, isFunctionType } from "../parsers/arrayliteral";
import { Variables } from "./variables";
import { Properties } from "./properties";
import { Functions } from "./functions";
import { Loops } from "./loops";
import { Modules } from "./modules";
import { BSArrowFunction } from "../parsers/arrowfunction";
import { BSSourceFile } from "../parsers/sourcefile";
import { BSClassDeclaration } from "../parsers/class";
import { assertNever } from "../util";

export enum InternalPropertyType {
  Value,
  Array,
}

export type Property = {
  tsType   : ts.Type | undefined;
  wasmType : WasmType;
  name     : string;
  offset   : number;
  type     : InternalPropertyType;
};

export enum ScopeName {
  Global,
  SourceFile,
  Function,
  Method,
  Class,
  ArrowFunction,
  For
};

export type ScopeType = 
  | { type : ScopeName.Global       }
  | { type : ScopeName.SourceFile   ; sourceFile: BSSourceFile;    }
  | { type : ScopeName.Function     ; symbol    : Symbol;          }
  | { type : ScopeName.Method       ; symbol    : Symbol;          }
  | { type : ScopeName.Class        ; symbol    : Symbol;          }
  | { type : ScopeName.ArrowFunction; node      : BSArrowFunction; }
  | { type : ScopeName.For          ; node      : BSForStatement;  }

export class Scope {
  parent    : Scope | null;
  children  : Scope[];
  variables : Variables;
  properties: Properties;
  functions : Functions;
  modules   : Modules;
  loops     : Loops;
  scopeType : ScopeType;
  moduleName: string | null;

  typeChecker: TypeChecker;
  sourceFile : BSSourceFile | null;
  jsTypes    : { [jsType: string]: string } = {};

  constructor(props: {
    tc        : ts.TypeChecker,
    sourceFile: BSSourceFile | null,
    scopeType : ScopeType,
    parent    : Scope | null,
    fileName  : string | null,
  }) {
    const { tc, sourceFile, scopeType, parent, fileName } = props;

    this.typeChecker = tc;
    this.sourceFile  = sourceFile;

    this.scopeType   = scopeType;
    this.parent      = parent;
    this.moduleName  = fileName;

    this.variables   = new Variables(this);
    this.properties  = new Properties(this);
    this.functions   = new Functions(this);
    this.loops       = new Loops(this);
    this.modules     = new Modules(this);
    this.children    = [];
  }

  // TODO: Somehow i want to ensure that this is actually targetting js
  // names... but im not sure how??? There are so many.
  addJsTypes(jsTypes: { [jsType: string]: string }): void {
    this.jsTypes = jsTypes;
  }

  getNativeTypeName(jsTypeName: string): string {
    return this.topmostScope().jsTypes[jsTypeName];
  }

  scopesEqual(one: ScopeType, two: ScopeType): boolean {
    switch (two.type) {
      case ScopeName.ArrowFunction:
        return one.type === ScopeName.ArrowFunction && one.node === two.node;
      case ScopeName.For:
        return one.type === ScopeName.For && one.node === two.node;
      case ScopeName.Global:
        return one.type === ScopeName.Global;
      case ScopeName.SourceFile:
        return one.type === two.type && one.sourceFile.moduleName === two.sourceFile.moduleName;
      case ScopeName.Method:
      case ScopeName.Class:
      case ScopeName.Function:
        return one.type === two.type && one.symbol.name === two.symbol.name;
      default:
        return assertNever(two);
    }
  }

  getChildScope(scopeType: ScopeType): Scope {
    const children = this.children.filter(child => {
      return this.scopesEqual(child.scopeType, scopeType);
    });

    if (children.length > 1) { throw new Error(`Too many scopes for ${ name }`); }
    if (children.length === 0) { throw new Error(`No scopes for ${ name }`); }

    return children[0];
  }

  addScopeFor(scopeType: ScopeType): void {
    if (scopeType.type === ScopeName.SourceFile) {
      this.children.push(new Scope({ 
        tc        : this.typeChecker, 
        sourceFile: scopeType.sourceFile, 
        scopeType : scopeType, 
        parent    : this, 
        fileName  : scopeType.sourceFile.moduleName,
      }));
    } else {
      this.children.push(new Scope({ 
        tc        : this.typeChecker, 
        sourceFile: this.sourceFile, 
        scopeType : scopeType, 
        parent    : this, 
        fileName  : this.moduleName,
      }));
    }
  }

  /**
   * By default (with no scope argument) this finds all declared scopes across
   * everything.
   */
  getAllScopes(scope: Scope | null): Scope[] {
    if (scope === null) { scope = this.topmostScope(); }

    let result = [scope];

    for (const child of scope.children) {
      result = result.concat(this.getAllScopes(child));
    }

    return result;
  }

  /**
   * By default (with no scope argument) this finds all declared classes across
   * everything.
   */
  getAllClasses(scope: Scope | null = null): Scope[] {
    if (scope === null) { scope = this.topmostScope(); }

    return this.getAllScopes(scope).filter(s => s.scopeType.type === ScopeName.Class);
  }

  getParameters(nodes: BSParameter[]): Param[] {
    return nodes.map(node => {
      let wasmType: "i32" = "i32";

      if (
        (node.tsType.flags & TypeFlags.Number) ||
        (node.tsType.flags & TypeFlags.String) ||
        isFunctionType(this, node.tsType)      ||
        isArrayType(this, node.tsType)
      ) {
        return {
          name: node.bindingName.text,
          type: wasmType,
        };
      }

      throw new Error("Unsupported parameter type!");
    });
  }

  getScopeForClass(type: Type): Scope | null {
    let classNameToFind = "";

    if (
      type.flags & TypeFlags.StringLike ||
      type.symbol.name === this.getNativeTypeName("String") // for this types
    ) {
      classNameToFind = this.getNativeTypeName("String");
    }

    if (
      isArrayType(this, type)
    ) {
      classNameToFind = this.getNativeTypeName("Array");
    }

    if (!classNameToFind) {
      throw new Error("Dont know the type of that class.");
    }

    const allClasses = this.getAllClasses();
    const relevantClasses = allClasses.filter(cls => 
      cls.scopeType.type === ScopeName.Class && 
      cls.scopeType.symbol.name === classNameToFind
    );

    if (relevantClasses.length === 0) {
      return null;
    }

    if (relevantClasses.length > 1) {
      return null;
    }

    return relevantClasses[0];
  }

  toString(indent = ""): string {
    let string = `${ indent }Scope for ${ this.scopeType.type }: `;

    if (this.variables.count() === 0 && this.functions.count() === 0) {
      string += "(Empty)\n";
    } else {
      string += "\n";

      if (this.variables.count() > 0) { string += `${ indent }  Variables: ${ this.variables.toString() }\n` ; }
      if (this.functions.count() > 0) { string += `${ indent }  Functions: ${ this.functions.toString() }\n` ; }
    }

    for (const scope of Object.keys(this.children).map(k => this.children[Number(k)])) {
      string += scope.toString(indent + "  ");
    }

    return string;
  }

  topmostScope(): Scope {
    let result: Scope = this;

    while (result.parent !== null) {
      result = result.parent;
    }

    return result;
  }
}
