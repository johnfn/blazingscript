import { Property, Scope, InternalPropertyType } from "./scope";
import { Type } from "typescript";
import { WasmType, Sexpr, S, sexprToString } from "../sexpr";
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
    type    : InternalPropertyType;
    wasmType: WasmType;
  }): void {
    this.properties.push(prop);
  }

  getAll(): Property[] {
    return this.properties;
  }

  get({ expr, exprScope, name }: {
    expr     : BSExpression,
    exprScope: Scope,
    name     : string
  }): Sexpr {
    // TODO: I could store the properties directly on the class node itself, so that i dont have to go hunting them down later.
    const cls = this.scope.getScopeForClass(expr.tsType);

    if (cls === null) {
      throw new Error(`Cant find appropriate scope for ${ name } on ${ expr.fullText } which is a ${ this.scope.typeChecker.typeToString(expr.tsType) }`);
    }

    const relevantProperties = cls.properties.getAll().filter(prop => prop.name === name);
    const relevantProperty = relevantProperties[0];

    if (relevantProperty) {
      const res = S.Add(
        expr.compile(exprScope),
        relevantProperty.offset
      );

      return res;
    }

    const relevantFunctions = cls.functions.list.filter(fn => fn.name === name);
    const relevantFunction  = relevantFunctions[0];

    if (relevantFunction) {
      let typeParam = "";

      if (relevantFunction.typeParamSig.length > 0) {
        if (relevantFunction.typeParamSig.length > 1) {
          throw new Error("Dont handle type param signatures > 1 length yet!");
        }

        typeParam = this.scope.typeParams.get(relevantFunction.typeParamSig[0]).substitutedType;
      }

      return S.Const(relevantFunction.getTableIndex(typeParam));
    }

    throw new Error(`cant find property ${ name } in class ${ expr.fullText }`);
  }
}