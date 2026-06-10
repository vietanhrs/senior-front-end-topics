# Transferable objects

## Two ways to move data across threads

When you `postMessage` between a page and a worker (or between workers), data crosses a thread
boundary. There are two mechanisms:

1. **Structured clone (default)** — the data is **deep-copied**. For a 50MB `ArrayBuffer` that's a
   50MB allocation + copy on *each* side. The original stays usable on the sender.
2. **Transfer** — ownership of the underlying memory is **handed over** with zero copy. The object
   becomes **detached (neutered)** on the sender (its `byteLength` goes to 0) and materializes on
   the receiver pointing at the *same* bytes. O(1) regardless of size.

```js
// copy: both sides have their own 50MB
worker.postMessage({ buf });

// transfer: near-instant, but `buf` is DETACHED here afterwards
worker.postMessage({ buf }, [buf]);   // 2nd arg = transfer list
console.log(buf.byteLength);          // → 0  (can't use it anymore)
```

## What's transferable

`ArrayBuffer`, `MessagePort`, `ImageBitmap`, `OffscreenCanvas`, `ReadableStream`/`WritableStream`/
`TransformStream`, `RTCDataChannel` (varies), `AudioData`/`VideoFrame`. **TypedArrays/DataViews
aren't transferable themselves** — transfer their **`.buffer`** (e.g.
`postMessage(view, [view.buffer])`), and reconstruct the view on the other side. Plain objects,
Blobs, and Strings are always cloned, never transferred.

## Detachment: the gotcha

After transfer the sender's buffer is **detached** — length 0, reads throw/return empty,
TypedArray views over it are unusable. Bugs:

- Transferring a buffer you still read afterwards → silent empty data or `TypeError`.
- Transferring a buffer that backs **multiple** views (you lose all of them).
- Transferring a `.buffer` that's shared with state you still need on the sender.

If you need the data on **both** sides, either copy (don't transfer) or transfer and have the
receiver **transfer a result back**.

## Structured clone vs transfer vs SharedArrayBuffer

| | Structured clone | Transfer | SharedArrayBuffer |
|---|---|---|---|
| Cost | O(n) copy | O(1) handoff | O(1), no handoff |
| Sender keeps data? | ✅ | ❌ detached | ✅ (truly shared) |
| Concurrent access? | no (separate copies) | no (one owner) | **yes** (needs Atomics) |
| Needs cross-origin isolation? | no | no | **yes** |

Rule of thumb: **transfer** for "I'm done with this big buffer, you take it" (image pipelines,
audio chunks, file processing); **SharedArrayBuffer** only when both threads must mutate the *same*
memory concurrently; **clone** for small messages where copy cost is irrelevant.

## Practical patterns

- **Image/file processing**: read into an `ArrayBuffer`, transfer to a worker, transfer the result
  back. Zero-copy both ways.
- **`OffscreenCanvas`**: transfer the canvas to a worker so rendering happens off the main thread.
- **Round-trip without losing data**: `worker.postMessage(result, [result.buffer])` from the
  worker so the main thread regains a (new) owned buffer.
- Measure: for large payloads, transfer eliminates the copy spike and GC pressure of cloning (both
  the allocation and the later collection).

## Senior checklist

- Default `postMessage` **copies** (structured clone); pass a **transfer list** for zero-copy handoff.
- Transferred `ArrayBuffer`s become **detached** (byteLength 0) on the sender — don't use them after.
- Transfer the `.buffer` of a TypedArray, not the view; transfer results back if both sides need data.
- Transfer for handoff, SAB for concurrent shared mutation, clone for small messages.

## References

- [MDN: Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [MDN: postMessage (transfer argument)](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage)
- [MDN: The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [web.dev: OffscreenCanvas](https://web.dev/articles/offscreen-canvas)
