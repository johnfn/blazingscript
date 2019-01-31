import { Property, Scope } from "./context";
import { Type } from "typescript";
import { WasmType, Sexpr, S } from "../sexpr";
import { BSExpression } from "../parsers/expression";

export class Properties {
  properties: Property[];
  scope     : Scope;

  constructor(scope: Scope) {
    this.scope      = scope;
    this.properties = [];
  }

  add(prop: {
    name    : string;
    offset  : number;
    tsType  : Type;
    wasmType: WasmType;
  }): void {
    this.properties.push(prop);
  }

  getAll(): Property[] {
    return this.properties;
  }

  get(
    expr: BSExpression,
    name: string
  ): Sexpr {
    // TODO: I could store the properties directly on the class node itself, so that i dont have to go hunting them down later.
    // TODO: This is bad?
    const cls = this.scope.context.getScopeForClass(expr.tsType);

    if (cls === null) {
      throw new Error(`Cant find appropriate scope for ${ expr.fullText }`);
    }

    const props = cls.properties;

    const relevantProperties = props.getAll().filter(prop => prop.name === name);
    const relevantProperty = relevantProperties[0];

    if (!relevantProperty) {
      throw new Error(`cant find property in class`);
    }

    const res = S.Load("i32", S.Add(
      expr.compile(cls.context),
      relevantProperty.offset
    ));

    return res;
  }
}