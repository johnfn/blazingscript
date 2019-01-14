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

// TODO: Come up with better way to write sexprs, probably with function application or something.

export class Sx {
  content: (string | Sexpr)[];

  constructor(...args: (string | Sexpr)[]) {
    this.content = args;
  }

  public static Func(p: { name: string, body: Sexpr[], params: Param[] }): Sexpr {
    const { name, body, params } = p;

    // TODO: Proper return types
    return S(
      "func", 
      `\$${ name }`, 
      ...Sx.Params(params), 
      S("result", "i32"),
      ...body,
    );
  }

  public static Export(name: string, type: "func"): Sexpr {
    return S(
      "export",
        `"${ name }"`, 
        S(
          "func", 
          `\$${ name }`, 
        )
    )
  }

  public static GetLocal(name: string): Sexpr {
    return S("get_local", "$" + name);
  }

  public static Param(param: Param): Sexpr {
    return {
      name: "param",
      body: ["$" + param.name, param.type],
    };
  }

  public static Params(params: Param[]): Sexpr[] {
    return params.map(param => Sx.Param(param));
  }
}

export function sexprToString(s: Sexpr): string {
  if (typeof s === "string") {
    return s;
  }

  return "(" + s.name + " " + s.body.map(b => sexprToString(b)).join(" ") + ")";
}
