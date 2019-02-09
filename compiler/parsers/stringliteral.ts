import { Scope } from "../scope/scope";
import { StringLiteral } from "typescript";
import { Sexpr, S, Sx } from "../sexpr";
import { BSNode, NodeInfo, defaultNodeInfo } from "./bsnode";

export class BSStringLiteral extends BSNode {
  children: BSNode[] = [];
  text: string;

  constructor(ctx: Scope, node: StringLiteral, info: NodeInfo = defaultNodeInfo) {
    super(ctx, node);

    this.text = node.text;
    ctx.variables.addOnce("string_temp", this.tsType, "i32");
  }

  compile(ctx: Scope): Sexpr {
    return S("i32",
      "block",
      S("[]", "result", "i32"),
      S.SetLocal(
        "string_temp",
        S("i32", "call", "$testcontents__malloc", S.Const(this.text.length + 4))
      ),
      // store length first
      S.Store(ctx.variables.get("string_temp"), this.text.length),
      // then contents
      ...Sx.SetStringLiteralAtSexpr(ctx.variables.get("string_temp"), this.text),
      ctx.variables.get("string_temp")
    );
  }
}
