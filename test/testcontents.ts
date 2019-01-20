// these will be overwritten by native 

declare type clogType = string | number;
declare const clog: (a: clogType, b?: clogType, c?: clogType) => void;
declare const mset: (pos: number, val: number) => void;
declare const mget: (pos: number) => number;

/*

class String {
  init(lhs: StrConst) {
    const length = __strlen(lhs);
    const mem = malloc(length);

    store(mem, length);

    for (let i = 0; i < length; i++) {
      store(mem + i + 1, __strget(lhs, i));
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

function test_basic_string(): number {
  let x = "abcd";
  const y = "1234";

  clog(x);
  clog(y);

  return 1;
}

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
