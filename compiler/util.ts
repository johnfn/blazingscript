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

export function flatArray(...args: (null | BSNode | BSNode[])[]): BSNode[] {
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