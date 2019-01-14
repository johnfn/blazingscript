import fetch from 'node-fetch';
import fs from 'fs'
import { instantiateStreaming } from 'wasm-instantiate-streaming'

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
    log: (arg) => {
      console.log(arg);
    }
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
).then(result =>
  console.log(result.instance.exports.foo(9, 5))
).catch(e => console.log(e))
