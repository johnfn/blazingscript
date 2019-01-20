import { ParameterDeclaration } from "typescript";
import { flatten } from "./rewriter";

// TODO: turn into class
export type Sexpr = {
  name: string;
  type: "i32" | "[]";
  body: (string | Sexpr)[];
}

export interface Param {
  name       : string;
  type       : string;

  optional  ?: boolean;

  declaration: ParameterDeclaration;
}

export function S(type: "i32" | "[]", name: string, ...body: (string | Sexpr)[]): Sexpr {
  return {
    name,
    body,
    type,
  };
}

S.Wrap = (type: "i32", body: Sexpr[]): Sexpr =>
  body.length === 1
    ? body[0]
    : S(
      type,
      "block",
      S(type, "result", type),
      ...body
    );

S.WrapWithType = (type: "i32", body: Sexpr[]): Sexpr => S(
  type,
  "block",
  S(type, "result", type),
  ...body,
  S.Const("i32", 0),
);

S.Const = (type: "i32", value: number): Sexpr => S(
  type,
  "i32.const", 
  String(value),
);

S.Drop = (expr: Sexpr): Sexpr => S(
  "[]",
  "drop",
  expr
);

S.Store = (pos: Sexpr, value: Sexpr): Sexpr => S(
  "[]",
  "i32.store",
  pos,
  value,
);

S.Load = (type: "i32", pos: Sexpr): Sexpr => S(
  type,
  "i32.load",
  pos,
);

S.Export = (name: string, type: "func"): Sexpr => S(
  "[]",
  "export",
  `"${name}"`,
  S(
    "[]",
    "func",
    `\$${name}`,
  )
);

// TODO: Proper return types
S.Func = ({ name, body, params }: { name: string, body: Sexpr[], params: Param[] }): Sexpr => S(
  "[]",
  "func",
  `\$${name}`,
  ...Sx.Params(params),
  S("[]", "result", "i32"),
  ...body,
);

S.GetLocal = (type: "i32", name: string): Sexpr => S(
  type,
  "get_local",
  "$" + name,
)

S.SetLocal = (name: string, value: Sexpr): Sexpr => S(
  "[]",
  "set_local",
  "$" + name,
  value,
);

S.DeclareLocal = (name: string, type: "i32"): Sexpr => S(
  "[]",
  "local",
  "$" + name,
  type
);

S.Param = (param: Param): Sexpr => S(
  "[]",
  "param",
  "$" + param.name, 
  param.type,
);

export class Sx {
  content: (string | Sexpr)[];

  constructor(...args: (string | Sexpr)[]) {
    this.content = args;
  }

  public static SetStringLiteralAt(pos: number, string: string): Sexpr[] {
    return string.split("").map((ch, i) => 
      S.Store(
        S.Const("i32", pos + i),
        S.Const("i32", ch.charCodeAt(0))
      )
    );
  }

  public static Params(params: Param[]): Sexpr[] {
    return params.map(param => S.Param(param));
  }
}

export function sexprToString(s: string | Sexpr): string {
  if (typeof s === "string") {
    return s;
  }

  return "(" + s.name + " " + s.body.map(b => sexprToString(b)).join(" ") + ")";
}