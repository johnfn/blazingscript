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

interface BuiltInArray { [key: number]: number; }

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
  private allocatedLength = 0;

  @property(4)
  length = 0;

  @property(8)
  private elemSize = 0;

  @property(12)
  private contents = 0;

  [key: number]: T;
  @operator("[]")
  getAddress(i: number): number {
    return this.contents + i * 4;
  }

  get(i: number): number {
    return memread(this.contents + i * 4);
  }

  private set(index: number, value: number): number {
    // TODO: Can i use []
    memwrite(this.contents + index * 4, value);

    // TODO some sort of hack beacuse bs doesnt accept void functions yet? i think?
    return 1;
  }

  private reallocate() {
    this.allocatedLength = this.allocatedLength * 2;

    const newContent = malloc(this.allocatedLength * 4);

    for (let i = 0; i < this.length; i++) {
      memwrite(newContent + i * 4, this.get(i));
    }

    this.contents = newContent;

    return 1;
  }

  push(value: number): number {
    if (this.length >= this.allocatedLength) {
      this.reallocate();
    }

    this.set(this.length, value);
    this.length = this.length + 1;

    return 1;
  }

  indexOf(value: number): number {
    for (let i = 0; i < this.length; i++) {
      if (this.get(i) === value) {
        return i;
      }
    }

    return -1;
  }

  private constructArrayWithSize(size: number): number[] {
    const result: number[] = malloc(4 * 4) as any as number[];

    result.contents        = malloc((size + 1) * 4);
    result.allocatedLength = (size + 1) * 4;
    result.length          = size;
    result.elemSize        = 4;

    return result;
  }

  concat(secondArray: number[]): number[] {
    const myLength = this.length;
    const result = this.constructArrayWithSize(myLength + secondArray.length);

    for (let i = 0; i < myLength; i++) {
      result.set(i, this.get(i));
    }

    for (let j = 0; j < secondArray.length; j++) {
      result.set(j + myLength, secondArray.get(j));
    }

    return result as any;
  }

  reverse(): number[] {
    const myLength = this.length;
    let temp = 0;

    for (let i = 0; i < myLength / 2; i++) {
      temp = this.get(i);

      this.set(i, this.get(this.length - i - 1));
      this.set(this.length - i - 1, temp);
    }

    return this as any;
  }

  map(fn: (val: number) => number): number[] {
    const result = this.constructArrayWithSize(this.length);

    for (let i = 0; i < result.length; i++) {
      result.set(i, fn(this.get(i)));
    }

    return result;
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
  let x   = "abcd";
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
  const chx   = "abcde";
  const char1 = chx[0];
  const char2 = chx[1];

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
  const array = [1, 2, 3, 4, 5, 6, 7];

  return (
    array[0] === 1 &&
    array[1] === 2 &&
    array[2] === 3
  );
}

function test_easy_push() {
  const array = [1, 2, 3, 4];

  array.push(1);
  array.push(2);
  array.push(3);

  return (
    (array[0] + array[1] + array[2] + array[3] + array[4] + array[5] + array[6]) === 16 &&
    array.length === 7
  );
}

function test_long_push() {
  // TODO: Cant figure out how to do this the right way. TS gets antsy without a proper type.

  const array = [0];

  for (let i = 1; i < 100; i++) {
    array.push(1);
  }

  let sum = 0;

  for (let j = 0; j < 100; j++) {
    sum = sum + array[j];
  }

  return sum === 99;
}

function test_array_indexOf() {
  const array = [5, 9, 1, 0, 4];

  return (
    array.indexOf(5)   === 0 &&
    array.indexOf(9)   === 1 &&
    array.indexOf(1)   === 2 &&
    array.indexOf(0)   === 3 &&
    array.indexOf(4)   === 4 &&
    array.indexOf(777) === -1
  );
}

function test_array_concat() {
  const arr1 = [1, 2, 3];
  const arr2 = [4, 5, 6, 7, 8];

  const result = arr1.concat(arr2);

  return (
    result.length === 8 &&
    result[3] === 4
  );
}

function test_reverse() {
  const arr1 = [1, 2, 3];

  arr1.reverse();

  return (
    arr1[0] === 3 &&
    arr1[1] === 2 &&
    arr1[2] === 1
  );
}

function test_reverse_even() {
  const arr1 = [1, 2, 3, 4];

  arr1.reverse();

  return (
    arr1[0] === 4 &&
    arr1[1] === 3 &&
    arr1[2] === 2 &&
    arr1[3] === 1
  );
}

function test_reverse_result() {
  const arr1 = [1, 2, 3, 4];
  const result = arr1.reverse();

  return (
    result[0] === 4 &&
    result[1] === 3 &&
    result[2] === 2 &&
    result[3] === 1
  );
}

function test_function_reference() {
  const add = toCall;

  return add(1, 2) === 3;
}

function mapMe(x: number) {
  return x * 2;
}

function test_array_map() {
  const myArray = [1, 2, 3, 4];
  const result = myArray.map(mapMe)

  return (
    result[0] === 2 &&
    result[1] === 4 &&
    result[2] === 6 &&
    result[3] === 8
  );
}

function test_array_assign_squarebrackets() {
  const myArray = [0, 0, 0, 0];

  myArray[0] = 5;
  myArray[1] = 3;
  myArray[2] = 1;
  myArray[3] = 0;

  return (
    myArray[0] === 5 &&
    myArray[1] === 3 &&
    myArray[2] === 1 &&
    myArray[3] === 0
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