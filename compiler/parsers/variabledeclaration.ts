import { BSExpression, BSBindingName } from "./expression";
import { VariableDeclaration, TypeFlags, SymbolFlags } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultExpr } from "./bsnode";
import { Scope } from "../scope/scope";
import { S, Sexpr } from "../sexpr";
import { buildNode } from "./nodeutil";
import { flattenArray } from "../util";
import { isArrayType, isFunctionType } from "./arrayliteral";

export class BSVariableDeclaration extends BSNode {
  children   : BSNode[];
  nameNode   : BSBindingName;
  name       : string;
  initializer: BSExpression | null;

  constructor(scope: Scope, node: VariableDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.children = flattenArray(
      this.initializer = buildNode(scope, node.initializer),
      this.nameNode    = buildNode(scope, node.name),
    );

    if (
      this.tsType.flags & TypeFlags.NumberLike ||
      this.tsType.flags & TypeFlags.StringLike ||
      isFunctionType(scope, this.tsType)       ||
      (this.tsType.symbol && this.tsType.symbol.flags & SymbolFlags.ObjectLiteral) ||
      isArrayType(this.tsType)
    ) {
      scope.variables.add({ name: this.nameNode.text, wasmType: "i32", isParameter: false });
    } else {
      throw new Error(`Do not know how to handle that type: ${ TypeFlags[this.tsType.flags] } for ${ this.fullText }`);
    }

    this.name = this.nameNode.text;
  }

  compile(scope: Scope): CompileResultExpr {
    const name                = this.name;
    const compiledInitializer = this.initializer ? this.initializer.compile(scope) : { expr: S.Const(0), functions: [] };

    const expr = S.SetLocal(
      name,
      compiledInitializer.expr,
    );

    return {
      expr,
      functions: compiledInitializer.functions,
    };
  }
}
