// these will be overwritten by native 

declare type clogType = string | number;
declare const clog: (a: clogType, b?: clogType, c?: clogType) => void;
declare const mset: (pos: number, val: number) => void;
declare const mget: (pos: number) => number;

declare const __strlen: (str: string) => number;
declare const __strget: (str: string, pos: number) => number;

function strlen(s: string): number {
  return mget(s as any as number);
}


/*
function __initStr(lhs: string) {
  const mem = malloc(__strlen(lhs));

  mset(mem, __strlen(lhs));

  for (let i = 0; i < __strlen(lhs); i++) {
    mset(mem + i + 1, __strget(lhs, i));
  }

  return mem;
}
*/

/*

class String {
  init(lhs: StrConst) {
    const mem = malloc(strlen(lhs));

    store(mem, strlen(lhs));

    for (let i = 0; i < strlen(lhs); i++) {
      store(mem + i + 1, strget(lhs, i));
    }

    return mem;
  }
}
*/

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

function getOffset(): number {
  return mget(0);
}

function setOffset(value: number): number {
  mset(0, value);

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

function test_basic_string() {
  let x = "abcd";
  const y = "12345";

  if (strlen(x) === 4 && strlen(y) === 5) {
    return true;
  }

  return false;
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

  return x === 55;
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
