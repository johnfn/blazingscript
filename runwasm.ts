import fs from 'fs'

var memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100
});

/*
instantiateStreaming(fs.readFileSync('test.wasm'), { js: { mem: memory } })
.then(obj => {
  var sum = obj.instance.exports.foo(5, 10);
  console.log(sum);
}).catch(e => console.log(e))
*/

var importObject = {
  console: {
    log: (arg: string) => {
      console.log(arg);
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
      e3: number
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

      console.log("__tests__/testcontents.ts log:", ...res);
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


WebAssembly.instantiate(
  fs.readFileSync('test.wasm')
  , importObject
).then(result => {
  console.log("begin run of test.wasm");
  console.log("");

  console.log(result.instance.exports)
  console.log(result.instance.exports.test_simple_fat_arrow_fucntion())
}).catch(e => console.log(e))
