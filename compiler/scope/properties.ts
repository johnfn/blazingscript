import { Symbol, Type, TypeChecker, ClassDeclaration, PropertySignature, Declaration, PropertyAccessEntityNameExpression, PropertyAccessExpression, PropertyDeclaration } from "typescript";
import { WasmType, Sexpr, S, sexprToString } from "../sexpr";
import { BSClassDeclaration } from "../parsers/class";
import { AstUtil } from "../astutil";

export type Property = {
  tsType   : Type;
  wasmType : WasmType;
  offset   : number;
  type     : InternalPropertyType;
  decl     : PropertyDeclaration;
};

export type PropertyGroup = {
  properties: Property[];
  id        : PropertyGroupId;
}

type PropertyGroupId = {
  classDecl: ClassDeclaration;
}

export enum InternalPropertyType {
  Value,
  Array,
};

export class Properties {
  groups : PropertyGroup[];
  checker: TypeChecker;

  constructor(checker: TypeChecker) {
    this.checker    = checker;
    this.groups = [];
  }

  add(node: PropertyAccessExpression): Property {
    const propDecl  = AstUtil.GetPropertyDeclaration(this.checker, node);
    const classDecl = AstUtil.GetClassDeclarationOfType(
      this.checker.getTypeAtLocation(node.expression)
    );
    const propInfo  = BSClassDeclaration.GetPropertyType(propDecl);
    const type      = this.checker.getTypeAtLocation(node);

    if (propInfo === null) { throw new Error(`Property ${ propDecl.getText() } does not have decorators. No good!`); }

    const prop: Property = {
      tsType  : type,
      wasmType: "i32",
      decl    : propDecl,
      offset  : propInfo.offset,
      type    : propInfo.type,
    };

    let group = this.groups.find(group => group.id.classDecl === classDecl);

    if (!group) {
      group = {
        properties: [],
        id        : { classDecl: classDecl },
      };

      this.groups.push(group);
    }

    group.properties.push(prop);

    return prop;
  }

  getByNode(node: PropertyAccessExpression): Property | null {
    const propDecl  = AstUtil.GetPropertyDeclaration(this.checker, node);
    const classDecl = AstUtil.GetClassDeclarationOfType(
      this.checker.getTypeAtLocation(node.expression)
    );
    const relevantGroup = this.groups.find(group => group.id.classDecl === classDecl);

    if (relevantGroup) {
      const relevantProperty = relevantGroup.properties.find(prop => prop.decl === propDecl);

      if (relevantProperty) { 
        return relevantProperty;
      }
    }

    return this.add(node);
  }

  toString(): string {
    let str = "";

    for (const group of this.groups) {
      const decl = group.id.classDecl;

      str += decl.name!.text + "\n";
      str += group.properties.map(prop => prop.decl.getText()).join("\n");
      str += "=================================";
    }

    return str;
  }
}