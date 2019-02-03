import { Variable } from "./scope/variables";

export type WasmType = "i32" | "f32" | "i64" | "f64" | "[]";

// TODO: turn into class
export type Sexpr = {
  name: string;
  type: WasmType;
  body: (string | Sexpr)[];
};

export interface Param {
  name: string;
  type: string;
}

export function S(
  type: WasmType,
  name: string,
  ...body: (string | Sexpr)[]
): Sexpr {
  return {
    name,
    body,
    type
  };
}

S.Block = (body: Sexpr[]): Sexpr =>
  body.length === 1 ? body[0] : S("[]", "block", ...body);

S.Const = (value: number, type: WasmType = "i32"): Sexpr => S(type, "i32.const", String(value));

S.Add = (left: Sexpr | number, right: Sexpr | number): Sexpr => {
  return generateBinarySexpr(left, right, "add");
}

S.Sub = (left: Sexpr | number, right: Sexpr | number): Sexpr => {
  return generateBinarySexpr(left, right, "sub");
}

S.Mul = (left: Sexpr | number, right: Sexpr | number): Sexpr => {
  return generateBinarySexpr(left, right, "mul");
}

function generateBinarySexpr(left: number | Sexpr, right: number | Sexpr, fn: "add" | "sub" | "mul"): Sexpr {
  let leftSexpr : Sexpr;
  let rightSexpr: Sexpr;
  let type      : WasmType;

  if (typeof left === "number" && typeof right === "number") {
    type = "i32";
  } else if (typeof left === "number" && typeof right !== "number") {
    type = right.type;
  } else if (typeof left !== "number" && typeof right === "number") {
    type = left.type;
  } else if (typeof left !== "number" && typeof right !== "number") {
    if (left.type !== right.type) {
      throw new Error("Trying to wasm add 2 sexprs of different types.");
    } else {
      type = left.type;
    }
  } else {
    throw new Error("This is logically impossible to ever see, but it makes the TS compiler happy.")
  }

  if (type === "[]") {
    throw new Error("cant add 2 things and somehow get [].")
  }

  if (typeof left === "number") {
    leftSexpr = S.Const(left, type);
  } else {
    leftSexpr = left;
  }

  if (typeof right === "number") {
    rightSexpr = S.Const(right, type);
  } else {
    rightSexpr = right;
  }

  return S(type, `${ type }.${ fn }`, leftSexpr, rightSexpr);
}

S.Drop = (expr: Sexpr): Sexpr => S("[]", "drop", expr);

S.Store = (pos: Sexpr, value: Sexpr | number): Sexpr => {
  let valueSexpr: Sexpr;

  if (typeof value === "number") {
    valueSexpr = S.Const(value);
  } else {
    valueSexpr = value;
  }

  return S("[]", "i32.store", pos, valueSexpr);
}

S.Load = (type: "i32", pos: Sexpr): Sexpr => S(type, "i32.load", pos);

S.Export = (name: string): Sexpr =>
  S("[]", "export", `"${name}"`, S("[]", "func", `\$${name}`));

// TODO: Proper return types
S.Func = ({
  name,
  body,
  params
}: {
  name: string;
  body: Sexpr[];
  params: Param[];
}): Sexpr =>
  S(
    "[]",
    "func",
    name,
    ...Sx.Params(params),
    S("[]", "result", "i32"),
    ...body
  );

/**
 * Reminder: dont use this function! use ctx.getVariable instead.
 */
S.GetLocal = (type: "i32", name: string): Sexpr =>
  S(type, "get_local", "$" + name);

S.SetLocal = (name: string, value: Sexpr): Sexpr =>
  S("[]", "set_local", "$" + name, value);

S.DeclareLocal = (decl: Variable): Sexpr =>
  S("[]", "local", "$" + decl.name, decl.wasmType);

S.Param = (param: Param): Sexpr =>
  S("[]", "param", "$" + param.name, param.type);

export class Sx {
  content: (string | Sexpr)[];

  constructor(...args: (string | Sexpr)[]) {
    this.content = args;
  }

  public static SetStringLiteralAt(pos: number, string: string): Sexpr[] {
    return [
      S.Store(S.Const(pos), string.length),
      ...string
        .split("")
        .map((ch, i) =>
          S.Store(S.Const(pos + i), ch.charCodeAt(0))
        )
    ];
  }

  public static SetStringLiteralAtSexpr(pos: Sexpr, string: string): Sexpr[] {
    return [
      S.Store(pos, string.length),
      ...string
        .split("")
        .map((ch, i) =>
          S.Store(
            S.Add(pos, i + 4),
            S.Const(ch.charCodeAt(0))
          )
        )
    ];
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
