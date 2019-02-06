interface Array<T> {
  [i: number]: T;
  length: number;
  push(value: number): number;
  indexOf(value: number): number;
  concat(secondArray: number[]): number[];
  reverse(): number[];
  map(fn: (val: number) => number): number[];
}

interface Boolean {

}

interface Function {

}

interface IArguments {

}

interface Number {

}

interface Object {

}

interface RegExp {

}

interface String {
  [i: number]: string;
  readonly length: number;
  charAt(pos: number): string;
  charCodeAt(index: number): number;
  indexOf(searchString: string): number;
  endsWith(str: string): boolean;
  includes(str: string): boolean;
  lastIndexOf(str: string): number;
  repeat(value: number): string;
}
