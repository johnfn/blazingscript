import { ParameterDeclaration } from "typescript";
import { flatten } from "./rewriter";

// TODO: turn into class
export type Sexpr = string | {
  name: string;
  body: (string | Sexpr)[];
}

export interface Param {
  name       : string;
  type       : string;

  optional  ?: boolean;

  declaration: ParameterDeclaration;
}

export function S(name: string, ...body: (string | Sexpr)[]): Sexpr {
  return {
    name,
    body,
  };
}

S.Const = (value: number): string[] => [
  "i32.const", 
  String(value),
];

S.Store = (pos: Sexpr[], value: Sexpr[]): Sexpr[] => [
  ...pos,
  ...value,
  "i32.store"
]

S.Export = (name: string, type: "func"): Sexpr => S(
  "export",
  `"${name}"`,
  S(
    "func",
    `\$${name}`,
  )
);

// TODO: Proper return types
S.Func = ({ name, body, params }: { name: string, body: Sexpr[], params: Param[] }): Sexpr => S(
  "func",
  `\$${name}`,
  ...Sx.Params(params),
  S("result", "i32"),
  ...body,
);

S.GetLocal = (name: string): string[] => [
  "$" + name,
  "get_local",
]

S.SetLocal = (name: string, value: Sexpr[]): Sexpr[] => [
  ...value,
  "set_local", 
  "$" + name,
];

S.Local = (name: string, type: "i32"): Sexpr => S(
  "local",
  "$" + name,
  type
);

S.Param = (param: Param): Sexpr => S(
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
    return flatten(string.split("").map((ch, i) => 
      S.Store(
        S.Const(pos + i),
        S.Const(ch.charCodeAt(0))
      )
    ));
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
