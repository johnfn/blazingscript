import { Scope } from "../scope/scope";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { NamedImports, ObjectLiteralExpression, ObjectLiteralElementLike, Symbol } from "typescript";
import { buildNodeArray } from "./nodeutil";
import { BSPropertyAssignment } from "./propertyassignment";
import { flattenArray as flattenArray } from "../util";
import { BSIdentifier } from "./identifier";
import { BSArrayLiteral } from "./arrayliteral";

export type BSObjectLiteralElementLike = 
  | BSPropertyAssignment
  // | BSShorthandPropertyAssignment
  // | BSSpreadAssignment
  // | BSMethodDeclaration
  // | BSAccessorDeclaration

interface ObjectLiteralProperty {
  name  : string;
  offset: number;
};

interface ObjectLiteralMapping {
  propertyOffsets: ObjectLiteralProperty[];
  keyArrayOffset : 4;

  /** 
   * Character location of the declaration of the associated object literal
   * type. Used to identify which object literal type we're talking about.
   */
  declarationStart: number;
}

/**
 * e.g.
 * 
 * const obj = { x: 1, y: 2 }
 *             ^^^^^^^^^^^^^^
 */
export class BSObjectLiteralExpression extends BSNode {
  children  : BSNode[];
  properties: BSObjectLiteralElementLike[];
  declStart : number;

  constructor(scope: Scope, node: ObjectLiteralExpression, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.properties = buildNodeArray(scope, node.properties)
    );

    const declarations = this.tsType.symbol.declarations;

    if (declarations.length > 1) {
      throw new Error("Do not support object literals with > 1 declaration.")
    } else {
      this.declStart = this.tsType.symbol.declarations[0].getStart();
    }

    this.createObjectType(scope);

    scope.variables.addOnce("obj_temp", "i32");
    scope.variables.addOnce("array_temp", "i32");
    scope.variables.addOnce("array_content_temp", "i32");
  }

  static ObjectTypes: ObjectLiteralMapping[] = [];

  createObjectType(scope: Scope): void {
    let mapping = BSObjectLiteralExpression.ObjectTypes.find(x => x.declarationStart === this.declStart);

    if (mapping === undefined) {
      const props: ObjectLiteralProperty[] = [];
      const propTypes = scope.typeChecker.getPropertiesOfType(this.tsType);
      let offset = 4;

      for (const propType of propTypes) {
        props.push({
          offset,
          name: propType.name,
        });

        offset += 4;
      }

      const newMapping: ObjectLiteralMapping = {
        declarationStart: this.declStart,
        keyArrayOffset  : 4,
        propertyOffsets : props,
      };

      BSObjectLiteralExpression.ObjectTypes.push(newMapping);
    }
  }

  public static FindObjectTypeBySymbol(symbol: Symbol): ObjectLiteralMapping {
    const declStart = symbol.declarations[0].getStart();
    const mapping = BSObjectLiteralExpression.ObjectTypes.find(x => x.declarationStart === declStart);

    if (!mapping) {
      throw new Error(`Could not find object literal type for ${ symbol.name }`);
    }

    return mapping;
  }

  compile(scope: Scope): Sexpr {
    const mapping         = BSObjectLiteralExpression.ObjectTypes.find(x => x.declarationStart === this.declStart)!;
    const allocatedLength = mapping.propertyOffsets.length * 4;

    return S("i32", "block", S("[]", "result", "i32"),
      S.SetLocal("obj_temp", S("i32", "call", "$malloc__malloc", S.Const(allocatedLength * 4))),

      // Store array of string keys
      /*
      S.Store(S.Add(
        scope.variables.get("array_temp"), 0), 
        BSArrayLiteral.EmitArrayLiteral(scope, this.properties.map(prop => {
          return prop.name
        }))
      ),
      */

      ...(
        mapping.propertyOffsets.map(({ name, offset }) => {
          const associatedPropertyNode = this.properties.find(prop => {
            if (prop.name instanceof BSIdentifier) {
              if (prop.name.text === name) {
                return true;
              } else {
                return false;
              }
            } else {
              throw new Error("Dont handle string or numeric literals as property names in object literals, yet.");
            }
          });

          if (associatedPropertyNode === undefined) {
            throw new Error(`Couldn't find a node for object literal property name ${ name }.`);
          }

          return S.Store(
            S.Add(scope.variables.get("obj_temp"), offset),
            associatedPropertyNode.compile(scope),
          );
        })
      ),

      scope.variables.get("obj_temp")
    );
  }
}
