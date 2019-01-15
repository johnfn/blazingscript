import { ParameterDeclaration } from "typescript";

// TODO: turn into class
export type Sexpr = {
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

S.Const = (value: number): Sexpr => S(
  "i32.const", 
  String(value)
);

S.Store = (pos: number, value: number): Sexpr => S(
  "i32.store",
  S.Const(pos),
  S.Const(value),
);

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

S.GetLocal = (name: string): Sexpr => S(
  "get_local", 
  "$" + name
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
    return string.split("").map((ch, i) => 
      S.Store(pos + i, ch.charCodeAt(0))
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
