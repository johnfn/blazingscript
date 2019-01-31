import { Scope } from "./context";
import { Sexpr, S, WasmType } from "../sexpr";
import { Type } from "typescript";

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

  get(name: string): Sexpr {
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

    throw new Error(`variable name ${name} not found in context!`);
  }

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
