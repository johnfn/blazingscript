import { Scope } from "../scope/scope";
import { StringLiteral } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

export class BSStringLiteral extends BSNode {
  children: BSNode[] = [];
  text: string;

  constructor(scope: Scope, node: StringLiteral, info: NodeInfo = defaultNodeInfo) {
    super(scope, node);

    this.text = node.text;
    scope.variables.addOnce("string_temp", "i32");
  }

  compile(scope: Scope): Sexpr {
    return S("i32",
      "block",
      S("[]", "result", "i32"),
      S.SetLocal(
        "string_temp",
        S("i32", "call", "$malloc__malloc", S.Const(this.text.length + 4))
      ),
      // store length first
      S.Store(scope.variables.get("string_temp"), this.text.length),
      // then contents
      ...Sx.SetStringLiteralAtSexpr(scope.variables.get("string_temp"), this.text),
      scope.variables.get("string_temp")
    );
  }
}
