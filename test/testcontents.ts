function operator(type: "+" | "===" | "!==") {
  return function __decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) { 

  };
}

class __String { 
  readonly length: number = 0;

  strLen(): number {
    return mget(this as any as number);
  }

  charCodeAt(i: number): number {
    return mget((this as any as number) + 4 + i) & 0x000000ff;
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
    const charCode = mget((this as any as number) + 4 + i) & 0x000000ff;
    const newStr = malloc(4 + 1);

    mset(newStr + 0, 1);
    mset(newStr + 4, charCode);

    return newStr as any as string;
  }

  indexOf(needle: string): number {
    const needleLen = needle.length;
    const haystackLen = this.length;

    for (let haystackStartPos = 0; haystackStartPos < haystackLen; haystackStartPos++) {
      let curPos = 0;

      for (curPos = haystackStartPos; curPos < haystackStartPos + needleLen; curPos++) {
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

    mset(newStr + 0, newLength);

    for (let i = 0; i < this.length; i++) {
      mset(newStr + 4 + i, this.charCodeAt(i));
    }

    for (let j = 0; j < other.length; j++) {
      mset(newStr + 4 + myLen + j, other.charCodeAt(j));
    }

    return newStr as any as string;
  }
}

interface String extends __String {
  readonly length: number;
  charAt(pos: number): string;
  charCodeAt(index: number): number;
  indexOf(searchString: string, position: number): number;
}

declare type clogType = string | number;
declare const clog    : (a: clogType, b?: clogType, c?: clogType) => void;
declare const mset    : (pos: number, val: number) => void;
declare const mget    : (pos: number) => number;
declare const divfloor: (a: number, b: number) => number;

function getOffset(): number {
  return mget(0);
}

function setOffset(val: number): number {
  mset(0, val);

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

  return (
    y === x + 5 &&
    z === y + 5 &&
    z < 1000
  );
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
    mset(0, 0);
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

function test_string_charCodeAt() {
  const x = "abcde";

  return x.charCodeAt(0) === 97 &&
         x.charCodeAt(1) === 98 &&
         x.charCodeAt(2) === 99 &&
         x.charCodeAt(3) === 100;
}

function test_str_array_access() {
  const x = "abcde";
  const char1: string = x[0];
  const char2: string = x[1];

  return (
    char1.charCodeAt(0) === 97 &&
    char2.charCodeAt(0) === 98
  )
}

function test_str_eq() {
  const a = "abc";
  const b = "abc";

  return (a === b);
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

  return (x.charAt(0) === "a" && x.charAt(1) === "b");
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
    a.indexOf("foo")  === 13
  );
}

/*

function test_for_loop_no_init() {
  let x = 0;
  let i = 10;

  for (i = 0; i < 10; i++) {
    x += i;
  }

  clog(x);

  return x === 65;
}

function test_compound_assignment() {
  let x = 1;

  x += 5;
  x += 5;

  return x === 10;
}


*/

/*
function test_statement_then_if() {
  let x = "blah";
  let y = strlen(x);

  if (y === 4) {
    return true;
  } else {
    return false;
  }
}
*/

/*
const x = malloc(5);
const y = malloc(6);
const z = malloc(7);

const foo = 1;

clog("malloced:", x);
*/

/*
function test_ifCall() {
  if (true) {
    mset(0, 1);
  } 

  return mget(0) === 1;
}
*/
