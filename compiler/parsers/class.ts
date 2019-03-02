import {
  ClassDeclaration,
  SyntaxKind,
  MethodDeclaration,
  PropertyDeclaration,
  Declaration,
  CallExpression,
  Identifier,
  NumericLiteral
} from "typescript";
import { Scope, ScopeName } from "../scope/scope";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr, CompileResultStatements } from "./bsnode";
import { BSMethodDeclaration } from "./method";
import { BSPropertyDeclaration, PropertyType } from "./propertydeclaration";
import { BSDecorator } from "./decorator";
import { buildNodeArray } from "./nodeutil";
import { flattenArray, assertNever } from "../util";
import { InternalPropertyType } from "../scope/properties";
import { flatten } from "../rewriter";

/**
 * e.g. class MyClass { ... }
 *      ^^^^^^^^^^^^^^^^^^^^
 */
export class BSClassDeclaration extends BSNode {
  children  : BSNode[];
  members   : BSNode[];
  decorators: BSDecorator[];
  name      : string;
  scope     : Scope;

  constructor(parentScope: Scope, node: ClassDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(parentScope, node);

    if (node.name) {
      this.name = node.name.text;
    } else {
      throw new Error("Dont currently handle anonymous functions.");
    }

    this.scope = parentScope.addScopeFor({ type: ScopeName.Class, symbol: this.tsType.symbol });

    this.decorators = buildNodeArray(this.scope, node.decorators);
    this.members = [...node.members].map(mem => {
      if (mem.kind === SyntaxKind.MethodDeclaration) {
        return new BSMethodDeclaration(this.scope, mem as MethodDeclaration);
      } else if (mem.kind === SyntaxKind.PropertyDeclaration) {
        return new BSPropertyDeclaration(this.scope, mem as PropertyDeclaration);
      } else if (mem.kind === SyntaxKind.IndexSignature) {
        return null;
      } else {
        console.log(mem.kind);

        throw new Error("Dont handle other things in classes yet.");
      }
    }).filter(x => x) as BSNode[];

    this.children = flattenArray(
      this.decorators,
      this.members,
    );
  }

  readableName() {
    return `Class ${ this.name }`;
  }

  compile(parentScope: Scope): CompileResultStatements {
    const compiledMembers = this.members.map(m => m.compile(this.scope));

    // TODO: This needs to change.
    return {
      statements: [],
      functions: flatten(compiledMembers.map(member => member.functions)),
    };
  }

  // TODO: interfaces - https://stackoverflow.com/questions/50526710/typescript-compiler-api-get-type-of-imported-names

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
