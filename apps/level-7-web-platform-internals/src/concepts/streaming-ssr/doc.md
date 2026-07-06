# Streaming SSR

## Blocking SSR vs streaming SSR

Classic SSR (`renderToString`) is **all-or-nothing**: the server renders the *entire* page to an
HTML string and sends it only when the **slowest** data dependency has resolved. One slow query
delays the **whole** document — the user stares at a blank screen (or the old page) until then.

**Streaming SSR** (`renderToPipeableStream` on Node, `renderToReadableStream` on edge/Web) sends
HTML **in chunks as it's produced**:

1. Flush the **shell** immediately — layout, header, and `<Suspense>` **fallbacks** for not-yet-ready
   regions. The browser paints this right away (fast FCP/TTFB).
2. As each suspended boundary's data resolves, the server streams that boundary's real HTML —
   followed by a tiny inline `<script>` that **swaps the fallback for the real content** in place.
3. Boundaries can arrive **out of order**: whichever resolves first is flushed first; the script
   slots each into the right spot.

```
TTFB ──▶ [shell + skeletons] ............ paint immediately
            ├─ sidebar resolves → stream <template>…</template> + swap script
            └─ main resolves   → stream <template>…</template> + swap script
```

## Why it's a platform topic

It relies on browser behavior, not just React: the browser **parses and renders HTML
incrementally** as bytes arrive, and executes the inline swap scripts mid-stream. React's piece is
mapping `<Suspense>` boundaries to flushable chunks; the *streaming + incremental parse + inline
script swap* is the platform. (This is also what powers **selective hydration**, Level 2: React
can hydrate a boundary as soon as its HTML + JS are present, out of order, prioritized by
interaction.)

## The win, concretely

- **TTFB / FCP** drop to "time to render the shell," independent of the slowest data.
- **Per-section reveal**: fast content (nav, above-the-fold) shows immediately; slow content
  (recommendations, comments) streams in without blocking it.
- Works with **HTTP chunked transfer** (or HTTP/2/3 streams) — no client framework needed to *see*
  the streamed HTML; hydration enhances it.

## Gotchas & constraints

- **Status code & headers commit early.** Once you start streaming you've already sent `200` and
  headers — you can't later switch to a `500`/redirect. Handle errors inside boundaries (stream an
  error UI) and decide what's in the shell vs deferred.
- **`<head>`/SEO**: metadata that must be in the initial response can't depend on a deferred
  boundary. Put SEO-critical tags in the shell.
- **Buffering proxies/CDNs** can defeat streaming (they may buffer the whole response). Ensure
  `Transfer-Encoding: chunked` is passed through and compression doesn't buffer.
- **Order vs layout**: out-of-order flush + swap scripts keep visual order correct, but design
  fallbacks to be the same size to avoid CLS when real content lands.
- **`onShellReady` vs `onAllReady`**: stream as soon as the shell is ready (interactive crawlers/
  SSR) — but for bots that need full HTML, you may wait for `onAllReady`.

## Senior checklist

- Streaming SSR flushes the shell + Suspense fallbacks first, then streams each boundary as it resolves (out of order), swapping via inline scripts.
- TTFB/FCP become independent of the slowest data; fast sections aren't blocked by slow ones.
- Status/headers commit at first flush — handle errors per boundary; keep SEO/head in the shell.
- Beware response-buffering proxies/compression; size fallbacks to avoid layout shift.

## Angular equivalent

Angular SSR can stream/render progressively depending on the server setup, but it does not use React Suspense swap scripts. The equivalent Angular concerns are early shell HTML, transfer cache, deterministic hydration, @defer, and incremental hydration/event replay.

## References

- [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [React 18 WG: Streaming SSR & Suspense](https://github.com/reactwg/react-18/discussions/37)
- [web.dev: Streaming server rendering](https://web.dev/articles/rendering-on-the-web#streaming_server_rendering)
- [MDN: Transfer-Encoding: chunked](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding)
