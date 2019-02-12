import { Scope } from "../scope/scope";
import {
  ForStatement,
  SyntaxKind,
  VariableDeclarationList,
} from "typescript";
import { Sexpr, S } from "../sexpr";
import { BSStatement } from "./statement";
import { BSVariableDeclarationList } from "./variabledeclarationlist";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";

/**
 * e.g. for (let x = 1; x < 5; x += 1) { myFunction("hello"); }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSForStatement extends BSNode {
  children: BSNode[];

  initializer: BSVariableDeclarationList | BSExpression | null;
  incrementor: BSExpression | null;
  condition  : BSExpression | null;
  body       : BSStatement | null;

  constructor(scope: Scope, node: ForStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.initializer = buildNode(scope, node.initializer);
    this.incrementor = buildNode(scope, node.incrementor);
    this.condition   = buildNode(scope, node.condition);
    this.body        = buildNode(scope, node.statement);

    this.children = [
      ...(this.initializer ? [this.initializer] : []),
      ...(this.incrementor ? [this.incrementor] : []),
      ...(this.condition   ? [this.condition]   : []),
      ...(this.body        ? [this.body]        : []),
    ];
  }

  compile(scope: Scope): Sexpr {
    const initializerSexprs: Sexpr[] = [];

    if (this.initializer) {
      if (this.initializer instanceof BSVariableDeclarationList) {
        for (const v of this.initializer.declarations) {
          if (v.initializer) {
            initializerSexprs.push(
              S.SetLocal(v.nameNode.text, v.initializer.compile(scope))
            );
          }
        }
      } else {
        initializerSexprs.push(this.initializer.compile(scope));
      }
    }

    const inc = this.incrementor ? this.incrementor.compile(scope) : null;

    // TODO - we generate an increment with every continue statement. im sure
    // there's a better way!

    scope.loops.add(inc);

    const bodyComp = this.body ? this.body.compile(scope) : null;
    const cond = this.condition ? this.condition.compile(scope) : null;

    const result = S(
      "i32",
      "block",
      scope.loops.getBreakLabel(),
      ...initializerSexprs,
      S(
        "[]",
        "loop",
        scope.loops.getContinueLabel(),
        ...(cond
          ? [S("[]", "br_if", scope.loops.getBreakLabel(), S("i32", "i32.eqz", cond))]
          : []),
        ...(bodyComp ? [bodyComp] : []),
        ...(inc ? [inc] : []),
        S("[]", "br", scope.loops.getContinueLabel())
      )
    );

    scope.loops.pop();

    return result;
  }
}