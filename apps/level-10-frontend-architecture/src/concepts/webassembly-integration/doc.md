# WebAssembly integration

## What WASM is for

**WebAssembly (WASM)** is a portable, compact, **near-native-speed** bytecode that runs in the same
sandbox as JS, in a separate but interoperable VM. You compile C/C++/Rust/Go/AssemblyScript to a
`.wasm` module and call it from JS. It's not a replacement for JS — it's a **co-processor** for the
things JS is bad at:

- CPU-heavy compute: image/video/audio processing, codecs, compression, crypto, physics, ML
  inference, parsers, regex engines.
- Reusing existing native libraries (ffmpeg, SQLite, OpenCV, libsodium) in the browser.
- Deterministic, predictable performance (no GC pauses, ahead-of-time-ish optimization).

Real examples: Figma's rendering, Photoshop on the web, Google Earth, SQLite-WASM, ffmpeg.wasm.

## The integration model

```js
const { instance } = await WebAssembly.instantiate(bytes, imports);
instance.exports.add(2, 3); // call an exported function
```

- **Instantiate**: `WebAssembly.instantiate(bytesOrModule, importObject)` — or
  **`instantiateStreaming(fetch(url), imports)`** to compile *while* downloading (preferred). Returns
  a **module** (compiled, cacheable) + an **instance** (with `exports`).
- **Exports**: functions, a linear **`Memory`** (an `ArrayBuffer`), `Table`s, globals.
- **Imports**: JS functions/memory you pass *into* the module (its `env`) — how WASM calls back into
  JS (e.g. to log, to allocate, to do DOM work it can't do itself).

## Linear memory & the data-marshalling cost

WASM has **no DOM access** and only understands **numbers**. It operates on a flat
`WebAssembly.Memory` (a growable `ArrayBuffer`). To pass a string/array/struct you must **copy it
into that memory** and pass a pointer + length; to get results back you read the memory out. That
marshalling is the **integration tax**:

- **Don't cross the JS↔WASM boundary in a hot loop.** Each call has overhead and trivial ops
  (like `add`) are often *slower* via WASM than plain JS because the boundary cost dwarfs the work.
- **Batch**: hand WASM a big buffer, let it crunch entirely inside WASM, read the result once. Keep
  the heavy loop *inside* the module.
- Use **shared memory** (`SharedArrayBuffer`-backed `Memory`) + workers for threaded WASM (needs
  cross-origin isolation — level 8).

## Toolchain & loading

- **Rust** (`wasm-pack`, `wasm-bindgen`), **Emscripten** (C/C++), **AssemblyScript** (TS-like), **Go**.
  `wasm-bindgen`/Emscripten generate JS glue that handles the memory marshalling for you.
- Ship `.wasm` with `Content-Type: application/wasm` and use **`instantiateStreaming`**.
- Bundlers treat `.wasm` as an asset; Vite supports `?init`/`?url` imports.

## When NOT to use it

- DOM-heavy or glue code (WASM can't touch the DOM; you'd bounce through JS anyway).
- Small/occasional work where the boundary + load cost outweighs the speedup.
- When a faster algorithm or a Web API (WebCodecs, WebGPU, `crypto.subtle`) already does the job.

## Senior checklist

- WASM is a **near-native co-processor** for CPU-heavy work, interoperating with JS in the same
  sandbox; compile from Rust/C++/AssemblyScript and `instantiateStreaming` it.
- It only speaks **numbers + linear memory** — marshalling data in/out is the real cost; **don't
  cross the boundary in hot loops**, batch the work *inside* WASM.
- Use imports to let WASM call back into JS; shared `Memory` + workers for threads (cross-origin
  isolated).
- Reach for it for codecs/crypto/ML/native-lib reuse — not for DOM glue or trivial work where the
  overhead dominates.

## References

- [MDN: WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [MDN: WebAssembly.instantiateStreaming()](https://developer.mozilla.org/en-US/docs/Web/API/WebAssembly/instantiateStreaming_static)
- [Rust & WebAssembly book](https://rustwasm.github.io/docs/book/)
- [web.dev: WebAssembly](https://web.dev/explore/webassembly)
