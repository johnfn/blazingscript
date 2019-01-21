# BlazingScript
> A TypeScript to WASM compiler.

BlazingScript compiles a subset of TS to WebAssembly. 

> What's the difference between BlazingScript and [AssemblyScript](https://github.com/AssemblyScript/assemblyscript)? 

AssemblyScript is super cool! But the intention of AssemblyScript is to be a thin layer on top of WASM: they don't support things like union types, or optional primitive types, etc. The goal of BlazingScript is to *just write TypeScript*, not think at all about the fact that you're targeting WASM, and still get out reasonable WASM on the other side. 
