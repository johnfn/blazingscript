import { Type, CallExpression, SyntaxKind, Identifier, StringLiteral } from "typescript";
import { DecoratorArgument, Decorator } from "./astutil";
import { Operator } from "./scope/functions";


export class DecoratorUtil {
  public static GetDecorators(type: Type): Decorator[] {
    if (!type.symbol) { throw new Error("provided type has no decorators"); }

    const results: Decorator[] = [];
    const decl = type.symbol.valueDeclaration;

    if (!decl.decorators) {
      return [];
    }

    for (const deco of decl.decorators) {
      const callExpr = deco.expression as CallExpression;

      if (callExpr.expression.kind === SyntaxKind.Identifier) {
        const fnName = (callExpr.expression as Identifier).text;
        const args = callExpr.arguments.map<DecoratorArgument>(arg => {
          if (arg.kind === SyntaxKind.StringLiteral) {
            const str = arg as StringLiteral;

            return { type: "string", value: str.text };
          } else {
            throw new Error("unhandled decorator type.");
          }
        });

        results.push({
          name     : fnName,
          arguments: args,
        });
      }
    }

    return results;
  }

  public static GetOverloadType(type: Type): Operator | null {
    const decorators = this.GetDecorators(type);

    for (const dec of decorators) {
      const firstArg = dec.arguments[0];

      if (dec.name === "operator" && firstArg.type === "string" && firstArg.value in Operator) {
        return firstArg.value as Operator;
      }
    }

    return null;
  }
}