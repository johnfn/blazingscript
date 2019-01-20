import fs from 'fs';
import { Program } from '../compiler/program';
import { exec } from 'child_process';

async function runProgram(str: string): Promise<{ [test: string]: number }> {
  const results: { [test: string]: number } = {}
  
  const memory = new WebAssembly.Memory({
    initial: 10, 
    maximum: 100
  });

  const importObject = {
    console: {
      log: (arg: string) => {
        console.log("[asc]:", arg);
      }
    },

    c: {
      log: (
        t1: number, s1: number, e1: number,
        t2: number, s2: number, e2: number,
        t3: number, s3: number, e3: number,
      ) => {
        const args: {
          type: number;
          start: number;
          end: number
        }[] = [
          { type: t1, start: s1, end: e1 },
          { type: t2, start: s2, end: e2 },
          { type: t3, start: s3, end: e3 },
        ];

        let res: string[] = [];

        for (const { type, start, end } of args) {
          if (type === 0 /* string */) {
            const data = new Int8Array(memory.buffer.slice(start, end));
            const str = [...data].map(x => String.fromCharCode(x)).join("");

            res.push(str);
          } else if (type === 1 /* i32 */) {
            const data = new Int32Array(memory.buffer.slice(start, end))[0];

            res.push(String(data))
          } else if (type === 2 /* mem str */) {
            const buffLen = new Int32Array(memory.buffer.slice(start, start + 4))[0];
            const strbuff = new Int8Array(memory.buffer.slice(start + 4, start + 4 + buffLen));
            const str = [...strbuff].map(x => String.fromCharCode(x)).join("");

            res.push(str);
          } else if (type === 9999 /* unsupported */) {
            continue;
          } else {
            throw new Error("unsupported type passed to clog");
          }
        }

        console.log("[clog]:", ...res);
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

  fs.writeFileSync("temp", sexprs);

  await new Promise((resolve) => {
    exec('wat2wasm temp -o test.wasm', (err, stdout, stderr) => {
      if (stderr) {
        console.log(stderr)
      }

      resolve();
    })
  });

  const buff = fs.readFileSync("test.wasm")

  // return {};

  // const foo: any = {};

  // const foo = fufu.parseWat("", sexprs);
  //   const bin = foo.toBinary(importObject);

  await WebAssembly.instantiate(
    buff,
    importObject
  ).then(result => {
    for (const fn in result.instance.exports) {
      if (!fn.includes('test_')) { continue; }

      results[fn] = result.instance.exports[fn]();
    }
  }).catch(e => console.log(e));

  return results;
}

if (!('test' in global)) {
  (global as any).test = (name: string, fn: () => void) => fn();
}

test('all tests', async () => {
  const result = await runProgram(fs.readFileSync("test/testcontents.ts").toString());
  let anyfail = false;

  for (const key of Object.keys(result)) {
    if (result[key]) {
      console.log(`pass ${ key }`);
    } else {
      console.log(`FAIL ${ key } got ${ result[key] }`);

      anyfail = true;
    }
  }

  expect(anyfail).toBe(false);
});