import { IfStatement } from "typescript";
import { Sexpr, S } from "../sexpr";
import { Scope } from "../scope/scope";
import { BSStatement } from "./statement";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { BSExpression } from "./expression";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";

/**
 * e.g. if (foo) { bar() } else { baz() }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSIfStatement extends BSNode {
  children  : BSNode[];

  condition : BSExpression;
  ifTrue    : BSStatement | null;
  ifFalse   : BSStatement | null;

  constructor(scope: Scope, node: IfStatement, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.condition = buildNode(scope, node.expression),
      this.ifTrue    = buildNode(scope, node.thenStatement),
      this.ifFalse   = buildNode(scope, node.elseStatement),
    );
  }

  compile(scope: Scope): CompileResultExpr {
    const condCompiled = this.condition.compile(scope);
    let thenCompiled   = this.ifTrue  ? this.ifTrue.compile(scope)  : { statements: [], functions: [] };
    let elseCompiled   = this.ifFalse ? this.ifFalse.compile(scope) : { statements: [], functions: [] };

    const lastThenStatement = thenCompiled.statements[thenCompiled.statements.length - 1];
    const lastElseStatement = elseCompiled.statements[elseCompiled.statements.length - 1];

    if (lastThenStatement && lastThenStatement.type !== "[]") {
      const last = thenCompiled.statements.pop()!;
      thenCompiled.statements.push(S.Drop(last));
    }

    if (lastElseStatement && lastElseStatement.type !== "[]") {
      const last = elseCompiled.statements.pop()!;
      elseCompiled.statements.push(S.Drop(last));
    }

    return {
      expr: S(
        "[]",
        "if",
        condCompiled.expr,
        S("[]", "then", S.Block(thenCompiled.statements)),
        S("[]", "else", S.Block(elseCompiled.statements))
      ),
      functions: [
        ...thenCompiled.functions,
        ...elseCompiled.functions,
        ...condCompiled.functions,
      ],
    };
  }
}