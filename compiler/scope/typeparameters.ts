import { Scope } from "./scope";

interface TypeParameter {
  name           : string;
  substitutedType: string;
}

export class TypeParameters {
  list    : TypeParameter[];
  scope   : Scope;

  constructor(scope: Scope) {
    this.scope    = scope;
    this.list     = [];
  }

  /** 
   * Associates a type parameter with a type. If a type parameter with the
   * provided name already exists, replaces its type with the new type.
   */
  add(param: TypeParameter): void {

    // Replace existing parameter if necessary.
    for (let i = 0; i < this.list.length; i++) {
      if (this.list[i].name === param.name) {
        this.list[i] = param;

        return;
      }
    }

    this.list.push(param);
  }

  get(name: string): TypeParameter {
    for (const param of this.list) {
      if (param.name === name) {
        return param;
      }
    }

    throw new Error(`No type parameter named ${ name } found!`);
  }
}