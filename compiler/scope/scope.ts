import ts, { TypeFlags, Type, SourceFile, TypeChecker } from "typescript";
import { Param, WasmType } from "../sexpr";
import { BSMethodDeclaration } from "../parsers/method";
import { BSNode } from "../parsers/bsnode";
import { BSFunctionDeclaration } from "../parsers/function";
import { BSParameter } from "../parsers/parameter";
import { BSClassDeclaration } from "../parsers/class";
import { BSForStatement } from "../parsers/for";
import { assertNever } from "../util";
import { isArrayType } from "../parsers/arrayliteral";
import { Variables } from "./variables";
import { Properties } from "./properties";
import { Functions } from "./functions";
import { Loops } from "./loops";

export enum InternalPropertyType {
  Value,
  Array,
}

enum ScopeType {
  Function = "function",
  Method   = "method",
  Class    = "class",
  Global   = "global",
  For      = "for",
};

export type Property = {
  tsType   : ts.Type | undefined;
  wasmType : WasmType;
  name     : string;
  offset   : number;
  type     : InternalPropertyType;
};

type NodesWithScope =
  | BSFunctionDeclaration
  | BSForStatement
  | BSMethodDeclaration
  | BSClassDeclaration
  ;

export class Scope {
  parent    : Scope | null;
  children  : Scope[];
  variables : Variables;
  properties: Properties;
  functions : Functions;
  loops     : Loops;
  node      : BSNode | null;
  type      : ScopeType;

  typeChecker: TypeChecker;
  sourceFile : SourceFile;
  jsTypes    : { [jsType: string]: string } = {};

  constructor(
    tc: ts.TypeChecker,
    sourceFile: SourceFile,
    node: NodesWithScope | null,
    parent: Scope | null
  ) {
    this.typeChecker = tc;
    this.sourceFile  = sourceFile;

    this.node    = node;
    this.parent  = parent;

    this.variables  = new Variables(this);
    this.properties = new Properties(this);
    this.functions  = new Functions(this);
    this.loops      = new Loops(this);
    this.children   = [];

    this.type       = this.getScopeType(node);
  }

  // TODO: Somehow i want to ensure that this is actually targetting js
  // names... but im not sure how??? There are so many.
  addJsTypes(jsTypes: { [jsType: string]: string }): void {
    this.jsTypes = jsTypes;
  }

  getNativeTypeName(jsTypeName: string): string {
    return this.topmostScope().jsTypes[jsTypeName];
  }

  /*
  enterScopeFor(node: BSNode): void {
    const childContext = this.children.filter(context => context.node!.uid === node.uid)[0];

    if (childContext) {
      this.scope = childContext;
    } else {
      throw new Error(`Cant find scope for ${ node.readableName() }`);
    }
  }
  */

  getChildScope(node: BSNode): Scope {
    const childContext = this.children.filter(context => context.node!.uid === node.uid)[0];

    if (childContext) {
      return childContext;
    } else {
      throw new Error(`Cant find scope for ${ node.readableName() }`);
    }
  }

  addScopeFor(node: BSFunctionDeclaration | BSForStatement | BSMethodDeclaration | BSClassDeclaration): void {
    this.children.push(new Scope(this.typeChecker, this.sourceFile, node, this));
  }

  /*
  popScope(): void {
    const parent = this.parent;

    if (parent === null) {
      throw new Error("Got a null parent when I shouldn't have!");
    }

    this.scope = parent;
  }
  */

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

    return this.getAllScopes(scope).filter(s => s.type === ScopeType.Class);
  }

  getParameters(
    nodes: BSParameter[]
  ): Param[] {
    return nodes.map(node => {
      let wasmType: "i32" = "i32";

      if (
        (node.tsType.flags & TypeFlags.Number) ||
        (node.tsType.flags & TypeFlags.String) ||
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

    const allClasses = this.getAllClasses();
    const relevantClasses = allClasses.filter(cls => (cls.node as BSClassDeclaration).name === classNameToFind);

    if (relevantClasses.length === 0) {
      return null;
    }

    if (relevantClasses.length > 1) {
      return null;
    }

    const cls = relevantClasses[0];

    return cls;
  }

  toString(indent = ""): string {
    let string = `${ indent }Scope for ${ this.node ? this.node.readableName() : "[top level]" }: `;

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

  getScopeType(node: NodesWithScope | null) {
    if (node instanceof BSFunctionDeclaration) {
      return ScopeType.Function;
    } else if (node instanceof BSForStatement) {
      return ScopeType.For;
    } else if (node instanceof BSMethodDeclaration) {
      return ScopeType.Method;
    } else if (node instanceof BSClassDeclaration) {
      return ScopeType.Class;
    } else if (node === null) {
      return ScopeType.Global;
    } else {
      return assertNever(node);
    }
  }

  topmostScope(): Scope {
    let result: Scope = this;

    while (result.parent !== null) {
      result = result.parent;
    }

    return result;
  }
}
