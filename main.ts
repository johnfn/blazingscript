var memory = new WebAssembly.Memory({
  initial: 10, 
  maximum: 100
});

WebAssembly.instantiateStreaming(fetch('test.wasm'), { js: { mem: memory } })
.then(obj => {
  var sum = obj.instance.exports.foo(5, 10);
  console.log(sum);
}).catch(e => console.log(e))

/*
// in 64kb pages
const memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
});

const importObject = {
  // imports: {
  //   imported_func: (arg: any) => console.log(arg)
  // },
  mem: memory,
};

WebAssembly.instantiateStreaming(fetch('memory.wasm'), { js: { mem: memory } })


fetch('test.wasm').then(response =>
  response.arrayBuffer()
).then(bytes =>
  WebAssembly.instantiate(bytes, importObject)
).then(result => {
  console.log("Hemlloooo")

  var i32 = new Uint32Array(memory.buffer);

  for (var i = 0; i < 10; i++) {
    i32[i] = i;
  }

  var sum = result.instance.exports.accumulate(0, 10);
  console.log(sum);

  // result.instance.exports.exported_func()
}).catch(e => {
  console.log(e)
});

*/