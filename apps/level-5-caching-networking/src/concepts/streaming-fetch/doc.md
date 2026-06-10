# Streaming fetch response handling

## Buffered vs streaming

`response.json()` / `.text()` / `.arrayBuffer()` are **buffering** APIs: they wait for the **entire
body** to download, hold it all in memory, then hand it over. For a 100MB export or a slow
AI-generated answer, that means a long blank wait and a big allocation.

`response.body` is a **`ReadableStream<Uint8Array>`** — you can consume the body **chunk by chunk
as it arrives**:

```ts
const res = await fetch('/api/stream');
const reader = res.body!.getReader();
const decoder = new TextDecoder();        // bytes → text, statefully

for (;;) {
  const { done, value } = await reader.read();   // one chunk (Uint8Array)
  if (done) break;
  render(decoder.decode(value, { stream: true })); // show it NOW
}
```

Why it matters:
- **Time-to-first-content** drops from "whole download" to "first chunk" — this is how ChatGPT-style
  token streaming, log viewers, and progressive search results work.
- **Bounded memory**: you process and discard chunks instead of holding the full payload
  (backpressure applies — previous concept).
- **Progress**: chunk sizes + `Content-Length` give you a real progress bar.

## The details people get wrong

### 1. TextDecoder must be streaming
A multi-byte UTF-8 character can be **split across chunks**. `decoder.decode(value, { stream:
true })` keeps the partial sequence in the decoder's state; a final `decoder.decode()` flushes it.
Decoding each chunk independently corrupts characters (the � bug).

### 2. Chunks ≠ messages
TCP/QUIC chunking is arbitrary — a chunk may contain half a JSON line or three of them. Protocols
like **NDJSON** (one JSON per line) or **SSE** (`data: ...\n\n`) require you to **buffer until the
delimiter** and parse complete frames only:

```ts
let buf = '';
// inside the read loop:
buf += decoder.decode(value, { stream: true });
const lines = buf.split('\n');
buf = lines.pop()!;                 // keep the trailing INCOMPLETE line
for (const line of lines) if (line) handle(JSON.parse(line));
```

### 3. Pipe through TransformStreams
The composable version: `res.body.pipeThrough(new TextDecoderStream()).pipeThrough(splitLines())`
— each stage is a `TransformStream`, backpressure propagates automatically.

### 4. A body can be read once
Streams are single-consumer. Need it twice (render + cache)? `response.body.tee()` or
`response.clone()` *before* reading — but remember a teed branch that's never read buffers up.

### 5. Cancellation & errors
`reader.cancel()` / passing an `AbortSignal` to fetch stops the download mid-stream. Errors can
arrive **mid-body** (connection drop after 200 OK started) — your loop's `try/catch` must handle
partial output gracefully.

## Server-Sent Events vs hand-rolled streaming

`EventSource` (SSE) gives you reconnection + event framing for free over HTTP, but is GET-only and
text-only. A streamed `fetch` is more flexible (POST bodies, custom framing, abort) — most LLM APIs
stream over fetch with SSE-formatted payloads parsed manually.

## Upload streaming

Requests can stream too (`fetch(url, { body: readableStream, duplex: 'half' })`) — supported in
Chromium; check availability before relying on it.

## Senior checklist

- `.json()` buffers everything; `response.body.getReader()` processes chunks as they arrive.
- Always `TextDecoder` with `{ stream: true }`; buffer to delimiters before parsing frames.
- Prefer `pipeThrough(TextDecoderStream / TransformStream)` for composable, backpressured pipelines.
- One read per body (`tee`/`clone` for two); handle mid-stream errors and wire up AbortSignal.

## References

- [MDN: Using readable streams (fetch bodies)](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams)
- [web.dev: Streams — the definitive guide](https://web.dev/articles/streams)
- [MDN: TextDecoderStream](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream)
- [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
