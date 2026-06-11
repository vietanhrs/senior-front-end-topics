# Streaming SSR pipelines

> Level 7 covered *why* streaming SSR flushes out of order. This concept is about the **pipeline**:
> how the rendered chunks actually flow from the server renderer, through transforms, encoding, and
> the network, to the client — and how backpressure threads through all of it.

## The shape of the pipeline

Modern SSR isn't "render a string, send it." It's a **stream pipeline**:

```
renderToReadableStream(<App/>)        // ReadableStream<Uint8Array> of HTML chunks
  .pipeThrough(injectBootstrap)       // TransformStream: nonce, <script>, flush markers
  .pipeThrough(new CompressionStream('gzip'))
  → Response body                     // sent to the client as it's produced
```

On Node it's `renderToPipeableStream(...).pipe(res)`; on the edge/web it's
`renderToReadableStream(...)` returning a `ReadableStream` you `pipeThrough`/`pipeTo`. Either way the
key property is **incremental production**: the renderer emits the **shell** as soon as it's ready,
then emits each Suspense boundary's HTML as its data resolves — and each stage downstream processes
chunks as they arrive.

## The two readiness signals

- **`onShellReady` / shell flush:** the moment everything *outside* Suspense boundaries has rendered.
  Flush now → this is your **TTFB / first paint**. The client gets a usable shell with fallbacks.
- **`onAllReady`:** everything (including all boundaries) is done. Use this path for crawlers / static
  generation where you must not stream a partial document.

Between those, each boundary streams as a chunk containing the real HTML **plus an inline
`<script>` that swaps the fallback for the content** (React's `$RC(...)` runtime) — which is why
boundaries can arrive **out of order** and still slot into the right place.

## Where the pipeline stages matter

- **Transform stage (`pipeThrough`)**: inject the bootstrap script, a CSP `nonce`, preload links
  discovered during render, or rewrite URLs — all as a streaming `TransformStream`, never buffering
  the whole document.
- **Encoding/compression stage**: `TextEncoderStream`, `CompressionStream('gzip'|'deflate')` —
  composed into the same pipe, so compression also happens incrementally.
- **Backpressure (ties to the previous concept)**: `pipeTo`/`pipeThrough` propagate backpressure from
  the socket all the way back to the renderer. If the client is slow, the renderer is throttled
  instead of buffering the entire page in memory. This is why you pipe rather than read-all-then-send.
- **Aborting**: a `signal` (`AbortController`) lets you cap render time — abort the stream, let the
  client fall back to client-rendering the unfinished boundaries.

## Client side: progressive hydration

The HTML streams in and the browser paints it progressively. React attaches with
`hydrateRoot`, and **selective hydration** lets already-arrived boundaries hydrate (and respond to
clicks) before later ones have even streamed — the streaming pipeline and concurrent hydration are
designed together.

## Senior checklist

- SSR streaming is a **stream pipeline**: `renderToReadableStream` → `pipeThrough` transforms →
  compression/encoding → response, all incremental.
- Flush the **shell** at `onShellReady` (TTFB); boundaries stream after, each with an inline script
  that swaps its fallback — enabling out-of-order delivery.
- Use `pipeTo`/`pipeThrough` so **backpressure** propagates from the socket to the renderer (no
  whole-page buffering); use a `signal` to abort slow renders.
- `onAllReady` for crawlers/SSG; selective hydration lets early boundaries become interactive first.

## References

- [React: renderToReadableStream](https://react.dev/reference/react-dom/server/renderToReadableStream)
- [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [New Suspense SSR architecture in React 18](https://github.com/reactwg/react-18/discussions/37)
- [MDN: TransformStream / CompressionStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)
