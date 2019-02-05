import { Sexpr, S, WasmType } from "../sexpr";
import { Type } from "typescript";
import { Scope } from "./scope";

export type Variable = {
  tsType     : Type | undefined;
  wasmType   : WasmType;
  name       : string;
  isParameter: boolean;
};

export class Variables {
  variables: Variable[];
  scope    : Scope;

  constructor(scope: Scope) {
    this.variables = [];
    this.scope     = scope;
  }

  toString(): string {
    return this.variables.map(v => v.name).join(", ");
  }

  count(): number {
    return this.variables.length;
  }

  add(variable: {
    name        : string,
    tsType      : Type | undefined,
    wasmType    : "i32",
    isParameter : boolean,
  }): void {
    if (this.variables.filter(x => x.name === variable.name).length > 0) {
      throw new Error(`Already added ${variable.name} to scope!`);
    }

    this.variables.push(variable);
  }

  /**
   * Adds variable to scope, but won't error if it's already there.
   */
  addOnce(
    name        : string,
    tsType      : Type | undefined,
    wasmType    : "i32",
    isParameter = false
  ): void {
    if (this.variables.filter(x => x.name === name).length > 0) {
      return;
    }

    this.add({ name, tsType, wasmType, isParameter });
  }

  /**
   * Return a variable named name in the current scope, or null if there isn't one.
   */
  getOrNull(name: string): Sexpr | null {
    let currScope: Scope | null = this.scope;

    while (currScope !== null) {
      const found = currScope.variables.variables.filter(v => v.name === name);

      if (found.length > 1) {
        throw new Error("really weird thing in Context#getVariable")
      }

      if (found.length === 1) {
        return S.GetLocal("i32", found[0].name);
      }

      currScope = currScope.parent;
    }

    return null;
  }

  /**
   * Return a variable named name in the current scope, or throw an error if
   * there isn't one. You better be pretty sure there's a variable named name in
   * the current scope, buddy.
   */
  get(name: string): Sexpr {
    const result = this.getOrNull(name);

    if (result === null) {
      throw new Error(`variable name ${ name } not found in context!`);
    }

    return result;
  }

  /**
   * Return all variables in the current scope.
   */
  getAll(props: { wantParameters: boolean } ): Variable[] {
    const vars = this.variables;

    return vars.filter(v => {
      if (!props.wantParameters && v.isParameter) {
        return false;
      }

      return true;
    });
  }
}
