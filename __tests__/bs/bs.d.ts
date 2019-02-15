/**
 * BlazingScript definitions for core library types.
 */

interface Array<T> {
  [i: number]: T;
  length: number;
  push(value: number): number;
  indexOf(value: number): number;
  concat(secondArray: number[]): number[];
  reverse(): number[];
  map(fn: (val: number) => number): number[];
  generic_method<T>(x: T): T;
}

interface Boolean {

}

interface CallableFunction {

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

declare type LogType = string | number;
declare const log     : (a: LogType, b?: LogType, c?: LogType) => void;
declare const memwrite: (pos: number, val: number) => void;
declare const memread : (pos: number) => number;
declare const divfloor: (a: number, b: number) => number;
declare const operator: (type: "+" | "===" | "!==" | "[]") => ((target: any, propertyKey: string, descriptor: any) => void);
declare const property: (offset: number) => any;
declare const arrayProperty: (offset: number) => any;
declare const jsType: (x: string) => (<T extends { new (...args: any[]): {} }>(constructor: T) => T);