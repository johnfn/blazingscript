export function add(list: number[]): number {
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