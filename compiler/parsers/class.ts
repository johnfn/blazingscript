import {
  ClassDeclaration,
  SyntaxKind,
  MethodDeclaration,
  PropertyDeclaration,
  Type,
  TypeFlags,
  SignatureKind,
  Declaration,
  CallExpression,
  Identifier,
  StringLiteral,
  SymbolFlags,
  NumericLiteral
} from "typescript";
import { Scope, InternalPropertyType } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSMethodDeclaration } from "./method";
import { BSPropertyDeclaration, PropertyType } from "./propertydeclaration";
import { BSDecorator } from "./decorator";
import { buildNodeArray } from "./nodeutil";
import { flatArray, assertNever } from "../util";
import { OperatorOverload, Operator } from "../scope/functions";

/**
 * e.g. class MyClass { ... }
 *      ^^^^^^^^^^^^^^^^^^^^
 */
export class BSClassDeclaration extends BSNode {
  children  : BSNode[];
  members   : BSNode[];
  decorators: BSDecorator[];

  name: string;

  constructor(ctx: Scope, node: ClassDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    if (node.name) {
      this.name = node.name.text;
    } else {
      throw new Error("Dont currently handle anonymous functions.");
    }

    ctx.addScopeFor(this);
    const childCtx = ctx.getChildScope(this); {
      BSClassDeclaration.AddClassToScope({
        scope: childCtx,
        type : this.tsType,
      });

      this.decorators = buildNodeArray(childCtx, node.decorators);
      this.members = [...node.members].map(mem => {
        if (mem.kind === SyntaxKind.MethodDeclaration) {
          return new BSMethodDeclaration(childCtx, mem as MethodDeclaration);
        } else if (mem.kind === SyntaxKind.PropertyDeclaration) {
          return new BSPropertyDeclaration(childCtx, mem as PropertyDeclaration);
        } else if (mem.kind === SyntaxKind.IndexSignature) {
          return null;
        } else {
          console.log(mem.kind);

          throw new Error("Dont handle other things in classes yet.");
        }
      }).filter(x => x) as BSNode[];

      this.children = flatArray(
        this.decorators,
        this.members,
      );
    }
  }

  readableName() {
    return `Class ${ this.name }`;
  }

  compile(ctx: Scope): null {
    const childCtx = ctx.getChildScope(this); {
      for (const member of this.members) {
        member.compile(childCtx);
      }
    }

    return null;
  }

  // TODO: interfaces - https://stackoverflow.com/questions/50526710/typescript-compiler-api-get-type-of-imported-names

  public static AddClassToScope(props: { scope: Scope; type: Type }): void {
    const { type, scope } = props;
    const checker = scope.typeChecker;

    if (!(type.flags & TypeFlags.Object)) {
      throw new Error("Functions#addClass called on something which is not a class.")
    }

    const decls        = type.symbol.getDeclarations() || [];
    const instanceType = checker.getTypeAtLocation(decls[0]);
    const properties   = checker.getPropertiesOfType(instanceType);

    for (const prop of properties) {
      const propType = checker.getTypeOfSymbolAtLocation(prop, scope.sourceFile!.node);
      const decl     = prop.getDeclarations()![0];

      if (prop.flags & SymbolFlags.Method) {
        scope.functions.addMethod({
          type    : propType,
          node    : null,
          overload: BSClassDeclaration.GetOverloadType(decl),
        });
      } else if (prop.flags & SymbolFlags.Property) {
        const propInfo = BSClassDeclaration.GetPropertyType(decl);

        if (propInfo) {
          if (propInfo.type === InternalPropertyType.Value) {
            scope.properties.add({
              name    : prop.name,
              offset  : propInfo.offset,
              tsType  : propType,
              type    : InternalPropertyType.Value,
              wasmType: "i32",
            });
          } else if (propInfo.type === InternalPropertyType.Array) {
            scope.properties.add({
              name    : prop.name,
              offset  : propInfo.offset,
              tsType  : propType,
              type    : InternalPropertyType.Array,
              wasmType: "i32",
            });
          } else {
            assertNever(propInfo);
          }
        } else {
          console.log(decl.getText());

          throw new Error("All properties must be annotated currently!");
        }
      } else {
        throw new Error("got unhandled thing in a class!");
      }
    }
  }

  public static GetOverloadType(declaration: Declaration): OperatorOverload | null {
    const decorators = declaration.decorators;

    if (!decorators) {
      return null;
    }

    for (const deco of decorators) {
      if (deco.expression.kind === SyntaxKind.CallExpression) {
        const callExpr = deco.expression as CallExpression;

        if (callExpr.expression.kind === SyntaxKind.Identifier) {
          const fnNameIdentifier = callExpr.expression as Identifier;

          if (fnNameIdentifier.text === "operator") {
            const firstArgument = callExpr.arguments[0];

            if (firstArgument.kind === SyntaxKind.StringLiteral) {
              const firstArgumentStr = firstArgument as StringLiteral;
              const opName = firstArgumentStr.text as Operator;

              if (opName === Operator.NotEquals) {
                return { operator: Operator.NotEquals };
              } else if (opName === Operator.Add) {
                return { operator: Operator.Add };
              } else if (opName === Operator.TripleEquals) {
                return { operator: Operator.TripleEquals };
              } else if (opName === Operator.ArrayIndex) {
                return { operator: Operator.ArrayIndex };
              } else {
                assertNever(opName);
              }
            }
          }
        }
      }

    }

    return null;
  }

  public static GetPropertyType(declaration: Declaration): PropertyType | null {
    const decorators = declaration.decorators;

    if (!decorators) {
      return null;
    }

    for (const deco of decorators) {
      if (deco.expression.kind === SyntaxKind.CallExpression) {
        const callExpr = deco.expression as CallExpression;

        if (callExpr.expression.kind === SyntaxKind.Identifier) {
          const fnNameIdentifier = callExpr.expression as Identifier;

          if (fnNameIdentifier.text === "property") {
            const firstArgument = callExpr.arguments[0];

            if (firstArgument.kind === SyntaxKind.NumericLiteral) {
              return { type: InternalPropertyType.Value, offset: Number((firstArgument as NumericLiteral).text) };
            } else {
              throw new Error("Invalid arguments to @property")
            }
          }

          if (fnNameIdentifier.text === "arrayProperty") {
            const firstArgument = callExpr.arguments[0];

            if (firstArgument.kind === SyntaxKind.NumericLiteral) {
              return { type: InternalPropertyType.Array, offset: Number((firstArgument as NumericLiteral).text) };
            } else {
              throw new Error("Invalid arguments to @arrayProperty")
            }
          }
        }
      }
    }

    return null;
  }
}
