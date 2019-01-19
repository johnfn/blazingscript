import wabt from 'wabt'
import { Program } from '../compiler/program';

const fufu = (wabt as any)();

async function runProgram(str: string): Promise<{ [test: string]: number }> {
  const results: { [test: string]: number } = {}
  
  const memory = new WebAssembly.Memory({
    initial: 10, 
    maximum: 100
  });

  const importObject = {
    console: {
      log: (arg: string) => {
        console.log("[a]", arg);
      }
    },
    c: {
      log: (start: number, end: number) => {
        const data = new Int8Array(memory.buffer.slice(start, end));
        const str = [...data].map(x => String.fromCharCode(x)).join("");

        console.log("[a]", str);
      },
    },
    js: { mem: memory },
    imports: {
      imported_func: (arg: string) => {
        console.log(arg);
      }
    }
  };

  const sexprs = new Program(str).parse();
  const foo = fufu.parseWat("", sexprs);
  const bin = foo.toBinary(importObject);

  await WebAssembly.instantiate(
    bin.buffer, 
    importObject
  ).then(result => {
    for (const fn in result.instance.exports) {
      if (!fn.includes('test_')) { continue; }

      results[fn] = result.instance.exports[fn]();
    }
  }).catch(e => console.log(e));

  return results;
}
 
test("All tests I guess", async () => {
  const result = await runProgram(`
    function test_inc() {
      let x = 5;

      x++;

      return x;
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

    function malloc(): number {
      return mget(2);
    }

    function test_basic_mem() {
      mset(0, 0);
      mset(1, 1);
      mset(2, 2);
      mset(3, 3);
      return 3; //malloc() === 3;
    }

  `);

  let anyfail = false;

  console.log(result);
  let i = 0;

  for (const key of Object.keys(result)) {
    i++;
    if (result[key]) {
      console.log(`pass ${ key }`);
    } else {
      console.log(`FAIL ${ key }`);

      anyfail = true;
    }
  }

  console.log("blah", i)

  expect(anyfail).toBe(false);
});
