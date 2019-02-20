import ts, { Symbol, TypeFlags, Type, SourceFile, TypeChecker, SymbolFlags, ClassDeclaration } from "typescript";
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
import { assertNever } from "../util";
import { TypeParameters } from "./typeparameters";

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
  | { type : ScopeName.SourceFile   ; sourceFile: SourceFile;      }
  | { type : ScopeName.Function     ; symbol    : Symbol;          }
  | { type : ScopeName.Method       ; symbol    : Symbol;          }
  | { type : ScopeName.Class        ; symbol    : Symbol;          }
  | { type : ScopeName.ArrowFunction; node      : BSArrowFunction; }
  | { type : ScopeName.For          ; node      : BSForStatement;  }

export class Scope {
  parent    : Scope | null;
  children  : Scope[];
  variables : Variables;
  typeParams: TypeParameters;
  properties: Properties;
  functions : Functions;
  modules   : Modules;
  loops     : Loops;
  scopeType : ScopeType;

  typeChecker  : TypeChecker;
  sourceFile   : SourceFile;
  fileName     : string;

  /** 
   * This is a mapping from the name of JS builtin types - like String - to
   * their class definitions found in the BlazingScript standard library. It is
   * built by searching for @jsType annotations on classes.
   */
  nativeClasses: { [jsType: string]: ClassDeclaration } = {};

  constructor(props: {
    tc        : ts.TypeChecker,
    sourceFile: SourceFile,
    scopeType : ScopeType,
    functions : Functions,
    parent    : Scope | null,
  }) {
    const { tc, sourceFile, scopeType, parent, functions } = props;

    this.typeChecker = tc;
    this.sourceFile  = sourceFile;

    this.scopeType   = scopeType;
    this.parent      = parent;

    this.variables   = new Variables(this);
    this.properties  = new Properties(this);
    this.functions   = functions;
    this.loops       = new Loops(this);
    this.modules     = new Modules(this);
    this.typeParams  = new TypeParameters(this);

    this.children    = [];

    this.fileName = sourceFile.fileName;
  }

  addNativeClasses(nativeClasses: { [key: string]: ClassDeclaration }): void {
    this.nativeClasses = nativeClasses;
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
        return one.type === two.type && one.sourceFile.fileName === two.sourceFile.fileName;
      case ScopeName.Method:
      case ScopeName.Class:
      case ScopeName.Function:
        return one.type === two.type && one.symbol.name === two.symbol.name;
      default:
        return assertNever(two);
    }
  }

  addScopeFor(scopeType: ScopeType): Scope {
    const scope = new Scope({
      tc        : this.typeChecker, 
      sourceFile: scopeType.type === ScopeName.SourceFile ? scopeType.sourceFile : this.sourceFile, 
      scopeType : scopeType, 
      functions : this.functions,
      parent    : this, 
    });

    this.children.push(scope);

    return scope;
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
        (node.tsType.flags & TypeFlags.TypeParameter) ||
        isFunctionType(this, node.tsType)      ||
        isArrayType(node.tsType)
      ) {
        return {
          name: node.bindingName.text,
          type: wasmType,
        };
      }

      throw new Error("Unsupported parameter type!");
    });
  }

  getScopeForClass(type: Type): { className: string, cls: Scope } | null {
    let classNameToFind = "";

    if (
      type.flags & TypeFlags.StringLike ||
      type.symbol.name === "StringImpl" // for this types
    ) {
      classNameToFind = "StringImpl";
    }

    if (
      isArrayType(type)
    ) {
      classNameToFind = "ArrayImpl";
    }

    if (!classNameToFind) {
      throw new Error(`Dont know the type of that class - looking for ${ this.typeChecker.typeToString(type) }`);
    }

    const allClasses = this.getAllClasses();

    const relevantClasses = allClasses.filter(cls => 
      cls.scopeType.type === ScopeName.Class && 
      cls.scopeType.symbol.name === classNameToFind
    );

    if (relevantClasses.length === 0) {
      console.log("class name to find is", classNameToFind)

      throw new Error("Couldnt find that class");
    }

    if (relevantClasses.length > 1) {
      console.log("Found too many classes! Not really a problem but i should fix this at some point.");
    }

    return {
      className: classNameToFind,
      cls      : relevantClasses[0],
    };
  }

  toString(indent = ""): string {
    let string = this.localToString();

    if (this.variables.count() === 0) {
      string += "(Empty)\n";
    } else {
      string += "\n";

      if (this.variables.count() > 0) { string += `${ indent }  Variables: ${ this.variables.toString() }\n` ; }
    }

    for (const scope of Object.keys(this.children).map(k => this.children[Number(k)])) {
      string += scope.toString(indent + "  ");
    }

    return string;
  }

  localToString(): string {
    let string = `Scope for ${ ScopeName[this.scopeType.type] } `;

    switch (this.scopeType.type) {
      case ScopeName.ArrowFunction:
        string += "anoymous";
        break;
      case ScopeName.For:
      case ScopeName.Global:
        break;
      case ScopeName.SourceFile:
        string += this.scopeType.sourceFile.fileName;
        break;
      case ScopeName.Class:
      case ScopeName.Function:
      case ScopeName.Method:
        string += this.scopeType.symbol.name;
        break;
      default:
        assertNever(this.scopeType);
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
