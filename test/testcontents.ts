// these will be overwritten by native 

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

function __strlen(str: string): number {
  return mget(str as any as number);
}

function __charCodeAt(str: string, i: number): number {
  return mget((str as any as number) + 4 + i) & 0x000000ff;
}

function __charAt(str: string, i: number): string {
  const charCode = mget((str as any as number) + 4 + i) & 0x000000ff;
  const newStr = malloc(2);

  mset(newStr + 0, 1);
  mset(newStr + 4, charCode);

  return newStr as any as string;
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

// TODO: Need to flip conditional here

function test_for_loop() {
  let x = 0;

  for (let i = 0; i < 10; i++) {
    x = x + i;
  }

  return x === 55;
}

function test_basic_string() {
  let x = "abcd";
  const y = "12345";

  if (__strlen(x) === 4 && __strlen(y) === 5) {
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

function test_string_charAt() {
  const x = "abcde";

  // TODO i think these are because i'm not including any lib.d.ts when compiling TS...
  // should probably define my own library.d.ts at some point
  const char1: string = x.charAt(0);
  const char2: string = x.charAt(0);

  return (
    char1.charCodeAt(0) === 97 &&
    char2.charCodeAt(0) === 98
  );
}

/*
function test_str_array_access() {
  const x = "abcde";

  return x[0] === 'a' && x[1] === 'b';
}
*/

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

function test_nested_for_loop() {
  let sum = 0;

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      sum += (i + j);
    }
  }

  return sum = 123;
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
