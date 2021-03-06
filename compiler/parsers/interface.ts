import { InterfaceDeclaration } from "typescript";
import { BSNode, NodeInfo, defaultNodeInfo, CompileResultStatements } from "./bsnode";
import { Scope } from "../scope/scope";

/**
 * e.g. interface Foo { x: number }
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
 */
export class BSInterfaceDeclaration extends BSNode {
  children: BSNode[] = [];

  constructor(scope: Scope, node: InterfaceDeclaration, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);
  }

  compile(scope: Scope): CompileResultStatements {
    return {
      statements: [],
      functions : [],
    };
  }
}
