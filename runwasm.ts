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
      s1: number, e1: number,
      s2: number, e2: number,
      s3: number, e3: number,
    ) => {
      // const data = new Int8Array(memory.buffer.slice(start, end));

      // console.log([...data].map(x => String.fromCharCode(x)).join(""));
      console.log(s1, e1)
    },
  },
  js: { mem: memory },
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

  console.log(result.instance.exports.foo(9, 5))
}).catch(e => console.log(e))
