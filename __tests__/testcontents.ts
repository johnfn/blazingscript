// TODO
// * test that you can put all sorts of weird stuff in an if condition
//   * test that assignments return values

// types specially handled by the BlazingScript compiler

declare type LogType = string | number;
declare const log     : (a: LogType, b?: LogType, c?: LogType) => void;
declare const memwrite: (pos: number, val: number) => void;
declare const memread : (pos: number) => number;
declare const divfloor: (a: number, b: number) => number;
declare const operator: (type: "+" | "===" | "!==" | "[]") => ((target: any, propertyKey: string, descriptor: PropertyDescriptor) => void);
declare const property: (offset: number) => any;
declare const arrayProperty: (offset: number) => any;
declare const elemSize: <T> (array: Array<T> | ArrayInternal<T>) => number;

@jsType("String")
class StringInternal {
  @property(0)
  readonly length = 0;

  charCodeAt(i: number): number {
    return memread(((this as any) as number) + 4 + i) & 0x000000ff;
  }

  @operator("===")
  __equals(other: string): boolean {
    const myLen = this.length;
    const otherLen = other.length;

    if (myLen !== otherLen) {
      return false;
    }

    for (let i = 0; i < myLen; i++) {
      if (this.charCodeAt(i) !== other.charCodeAt(i)) {
        return false;
      }
    }

    return true;
  }

  @operator("!==")
  __notEquals(str: string): boolean {
    return !this.__equals(str);
  }

  charAt(i: number): string {
    const charCode = memread(((this as any) as number) + 4 + i) & 0x000000ff;
    const newStr = malloc(4 + 1);

    memwrite(newStr + 0, 1);
    memwrite(newStr + 4, charCode);

    return (newStr as any) as string;
  }

  [key: number]: string;
  @operator("[]")
  index(i: number): string {
    return this.charAt(i);
  }

  indexOf(needle: string): number {
    const needleLen = needle.length;
    const haystackLen = this.length;

    for (
      let haystackStartPos = 0;
      haystackStartPos < haystackLen;
      haystackStartPos++
    ) {
      let curPos = 0;

      for (
        curPos = haystackStartPos;
        curPos < haystackStartPos + needleLen;
        curPos++
      ) {
        if (curPos > haystackLen) {
          break;
        }

        if (this.charAt(curPos) === needle.charAt(curPos - haystackStartPos)) {
          continue;
        } else {
          break;
        }
      }

      if (curPos === haystackStartPos + needleLen) {
        return haystackStartPos;
      }
    }

    return -1;
  }

  @operator("+")
  __concat(other: string): string {
    const myLen = this.length;
    const otherLen = other.length;
    const newLength = myLen + otherLen;
    const newStr = malloc(newLength + 4);

    memwrite(newStr + 0, newLength);

    for (let i = 0; i < this.length; i++) {
      memwrite(newStr + 4 + i, this.charCodeAt(i));
    }

    for (let j = 0; j < other.length; j++) {
      memwrite(newStr + 4 + myLen + j, other.charCodeAt(j));
    }

    return (newStr as any) as string;
  }
}

interface String extends StringInternal {
  readonly length: number;
  charAt(pos: number): string;
  charCodeAt(index: number): number;
  indexOf(searchString: string, position: number): number;
}

@jsType("Array")
class ArrayInternal<T> {
  @property(0)
  allocatedLength = 0;

  @property(4)
  length = 0;

  @property(8)
  elemSize = 0;

  @arrayProperty(12)
  contents: number[] = [];

  [key: number]: T;
  @operator("[]")
  index(i: number): T {
    return memread(((this as any) as number) + 4 * 3 + i * this.elemSize) as any as T;
  }

  push(value: number) {
    if (this.length >= this.allocatedLength) {
      this.allocatedLength = this.allocatedLength * 2;
    }

    memwrite(
      ((this as any) as number) +
      4 * 3 +
      this.length * this.elemSize, value as any as number);

    this.length = this.length + 1;
  }
}

interface Array<T> extends ArrayInternal<T> {
  // [key: number]: T;
}

function getOffset(): number {
  return memread(0);
}

function setOffset(val: number): number {
  memwrite(0, val);

  return 0;
}

function malloc(size: number): number {
  if (getOffset() === 0) {
    setOffset(100);
  }

  let offset = getOffset();

  setOffset(offset + size);

  return offset;
}

function test_malloc() {
  const x = malloc(5);
  const y = malloc(5);
  const z = malloc(5);

  return y === x + 5 && z === y + 5 && z < 1000;
}

function test_inc() {
  let x = 7;

  x++;

  return x === 8;
}

function test_iff() {
  if (true) {
    return true;
  } else {
    return false;
  }
}

function test_niff() {
  if (!true) {
    return false;
  } else {
    return true;
  }
}

function test_and1() {
  if (true && true) {
    return true;
  } else {
    return false;
  }
}

function test_and2() {
  if (true && !true) {
    return false;
  } else {
    return true;
  }
}

function test_and3() {
  if (true && false) {
    return false;
  } else {
    return true;
  }
}

function test_not() {
  return !false;
}

function test_multivar() {
  let x = 1;
  let y = 2;
  let z = 3;

  return x + y + z === 6;
}

function toCall(x: number, y: number) {
  return x + y;
}

function test_call() {
  return toCall(1, 2) === 3;
}

function test_oneBranchIf() {
  if (true) {
    memwrite(0, 0);
  }

  return true;
}

function test_assign() {
  let x = 1;
  x = x + 1;

  return x === 2;
}

function test_for_loop() {
  let x = 0;

  for (let i = 0; i < 10; i++) {
    x = x + i;
  }

  return x === 45;
}

function test_basic_string() {
  let x = "abcd";
  const y = "12345";

  if (x.length === 4 && y.length === 5) {
    return true;
  }

  return false;
}

function test_string_length() {
  const x = "abcde";

  return x.length === 5;
}

function test_string_squarebrackets() {
  const x = "abcde";

  return (
    x[0] === "a" &&
    x[2] === "c"
  );
}

function test_string_charCodeAt() {
  const x = "abcde";

  return (
    x.charCodeAt(0) === 97 &&
    x.charCodeAt(1) === 98 &&
    x.charCodeAt(2) === 99 &&
    x.charCodeAt(3) === 100
  );
}

function test_str_array_access() {
  const x = "abcde";
  const char1 = x[0];
  const char2 = x[1];

  return char1.charCodeAt(0) === 97 && char2.charCodeAt(0) === 98;
}

function test_str_eq() {
  const a = "abc";
  const b = "abc";

  return a === b;
}

function test_str_neq1() {
  let a = "abcde";
  let b = "abcdef";

  return a !== b;
}

function test_str_neq2() {
  let a = "abcdef";
  let b = "abcdeg";

  return a !== b;
}

function test_string_charAt() {
  const x = "abcde";

  return x.charAt(0) === "a" && x.charAt(1) === "b";
}

function test_strcat() {
  const a = "abc";
  const b = "def";

  const res = a + b;

  return res === "abcdef";
}

function test_strcat3() {
  const a = "abc";
  const b = "def";
  const c = "ghi";

  const res = a + b + c;

  return res === "abcdefghi";
}

function test_nested_for_loop() {
  let sum = 0;

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      sum = sum + 1;
    }
  }

  return sum === 25;
}

function test_break() {
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum = sum + i;

    if (i === 4) {
      break;
    }
  }

  return sum === 10;
}

function test_continue() {
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    if (i % 2 === 1) {
      continue;
    }

    sum = sum + 1;
  }

  return sum === 5;
}

function test_indexOf() {
  const a = "testing blah foo";

  return (
    a.indexOf("test") === 0 &&
    a.indexOf("blah") === 8 &&
    a.indexOf("foo") === 13
  );
}

function test_statement_then_if() {
  let x = "blah";
  let y = x.length;

  if (y === 4) {
    return true;
  } else {
    return false;
  }
}

function test_basic_array() {
  const array = [1, 2, 3, 4];

  return array.length === 4;
}

function test_array_access() {
  const array = [1, 2, 3, 4];

  return (
    array[0] === 1 &&
    array[1] === 2 &&
    array[2] === 3
  );
}

function test_easy_push() {
  const array = [3, 2, 1];

  array.push(1);
  array.push(2);
  array.push(3);
  array.push(4);

  return (
    (array[0] + array[1] + array[2] + array[3] + array[4] + array[5] + array[6]) === 16 &&
    array.length === 7
  );
}

/*

function test_for_loop_no_init() {
  let x = 0;
  let i = 10;

  for (i = 0; i < 10; i++) {
    x += i;
  }

  log(x);

  return x === 65;
}

function test_compound_assignment() {
  let x = 0;

  x += 5;
  x += 5;

  return x === 10;
}


*/

/*
*/

/*
const x = malloc(5);
const y = malloc(6);
const z = malloc(7);

const foo = 1;

log("malloced:", x);
*/

/*
function test_ifCall() {
  if (true) {
    memwrite(0, 1);
  }

  return memread(0) === 1;
}
*/

// I'm putting this at the bottom because it screws with my syntax highlighting!

declare const jsType: (x: string) => (<T extends { new (...args: any[]): {} }>(constructor: T) => T);