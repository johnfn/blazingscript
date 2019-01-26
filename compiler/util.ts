export function add(list: number[]): number {
  let result = 0;

  for (const number of list) {
    result += number;
  }

  return result;
}