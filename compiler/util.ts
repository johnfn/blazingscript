import { BSNode } from "./parsers/bsnode";

export function sum(list: number[]): number {
  let result = 0;

  for (const number of list) {
    result += number;
  }

  return result;
}

export function removeNull<T>(list: (T | null)[]): T[] {
  const result: T[] = [];

  for (const x of list) {
    if (x) { result.push(x) }
  }

  return result;
}

export function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export function flattenArray(...args: (null | BSNode | BSNode[])[]): BSNode[] {
  let result: BSNode[] = [];

  for (const arg of args) {
    if (arg === null) {
      continue;
    } if (Array.isArray(arg)) {
      result = result.concat(arg);
    } else {
      result.push(arg);
    }
  }

  return result;
}

export function normalizeString(str: string): string {
  if (str.startsWith("./")) {
    str = str.slice(2);
  }

  if (str.endsWith(".ts")) {
    str = str.slice(0, -3);
  }

  if (str.endsWith(".tsx")) {
    str = str.slice(0, -4);
  }

  let result = "";

  for (const char of str) {
    if (char.match(/[a-z_]/i)) {
      result += char;
    } else {
      result += "_";
    }
  }

  return result;
}

export class Util {
  public static PrintStackTrace() {
    const e = new Error();

    console.log(e.stack);
  }
}