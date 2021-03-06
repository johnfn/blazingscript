Error.stackTraceLimit = Infinity;

import fs from "fs";
import path from "path";
import { Program } from "../compiler/program";
import { exec } from "child_process";

async function runProgram(str: string): Promise<{ [test: string]: number }> {
  const results: { [test: string]: number } = {};

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
        t1: number,
        s1: number,
        e1: number,
        t2: number,
        s2: number,
        e2: number,
        t3: number,
        s3: number,
        e3: number,

        line: number,
        char: number,
        whatev: number
      ) => {
        const args: {
          type: number;
          start: number;
          end: number;
        }[] = [
          { type: t1, start: s1, end: e1 },
          { type: t2, start: s2, end: e2 },
          { type: t3, start: s3, end: e3 }
        ];

        let res: string[] = [];

        for (const { type, start, end } of args) {
          if (type === 0 /* string */) {
            const data = new Int8Array(memory.buffer.slice(start, end));
            const str = [...data].map(x => String.fromCharCode(x)).join("");

            res.push(str);
          } else if (type === 1 /* i32 */) {
            const data = new Int32Array(memory.buffer.slice(start, end))[0];

            res.push(String(data));
          } else if (type === 2 /* mem str */) {
            const buffLen = new Int32Array(
              memory.buffer.slice(start, start + 4)
            )[0];
            const strbuff = new Int8Array(
              memory.buffer.slice(start + 4, start + 4 + buffLen)
            );
            const str = [...strbuff].map(x => String.fromCharCode(x)).join("");

            res.push(str);
          } else if (type === 9999 /* unsupported */) {
            continue;
          } else {
            throw new Error("unsupported type passed to clog");
          }
        }

        console.log(`__tests__/bs/testcontents.ts:${ line } log:`, ...res);
      }
    },
    js: {
      mem: memory,
      table: new WebAssembly.Table({ initial: 1000, element: "anyfunc" }),
    },
    imports: {
      imported_func: (arg: string) => {
        console.log(arg);
      }
    }
  };

  const sexprs = new Program({
    paths: [
      "./testcontents.ts",
      "./testother.ts",
      "./malloc.ts",
      "./array.ts",
      "./string.ts",
    ],
    root: path.join(__dirname, "bs"),
  }).parse();

  fs.writeFileSync("temp", sexprs);

  let fail = false;

  await new Promise(resolve => {
    exec("wat2wasm temp -o test.wasm", (err, stdout, stderr) => {
      if (stderr) {
        console.log(stderr);

        fail = true;
      }

      resolve();
    });
  });

  if (fail) {
    return {};
  }

  const buff = fs.readFileSync("test.wasm");

  // return {};

  // const foo: any = {};

  // const foo = fufu.parseWat("", sexprs);
  //   const bin = foo.toBinary(importObject);

  let currentTest = "";

  await WebAssembly.instantiate(buff, importObject)
    .then(result => {
      const allTests = Object.keys(result.instance.exports).filter(x => x.startsWith("test_"));
      const testOnly = allTests.filter(x => x.startsWith("test_only_"));

      if (testOnly.length > 0) {
        if (testOnly.length > 1) {
          throw new Error("more than 1 test with test_only_");
        }

        const name = testOnly[0];

        results[name] = result.instance.exports[name]();
      } else {
        for (const fn in result.instance.exports) {
          currentTest = fn;

          if (!fn.includes("test_")) {
            continue;
          }

          results[fn] = result.instance.exports[fn]();
        }
      }
    })
    .catch(e => {
      console.log("Error in test", currentTest);
      console.log(e);
    });

  return results;
}

if (!("test" in global)) {
  (global as any).test = (name: string, fn: () => void) => fn();
}

test("all tests", async () => {
  const result = await runProgram(
    fs.readFileSync("__tests__/bs/testcontents.ts").toString()
  );
  let failCount =
    Object.keys(result)
      .map(key => !result[key])
      .filter(x => x).length;

  if (failCount > 0) {
    console.log(`FAIL ${ failCount } of ${ Object.keys(result).length }!`);

    for (const key of Object.keys(result)) {
      if (result[key]) {
        // console.log(`pass ${ key }`);
      } else {
        console.log(`FAIL ${ key } got ${ result[key] }`);
      }
    }
  } else {
    console.log(`Pass ${Object.keys(result).length} tests`);
  }

  expect(failCount).toBe(0);
});
