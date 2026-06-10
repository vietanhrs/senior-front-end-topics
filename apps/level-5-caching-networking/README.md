# Level 5 — Caching & Networking

Interactive SPA workbook for 10 concepts on latency, freshness, and flow control. Built on the
shared `@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite · Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                       # (run at the repo root)
bun run --filter level-5-caching-networking dev      # dev server
bun run --filter level-5-caching-networking build    # type-check + production build
```

## Architecture

Thin app on top of the shared engine (`packages/workbook`, imported as `@sfe/workbook`, aliased to
its TS source in `vite.config.ts` + `tsconfig.json`).

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 10 concepts)
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts
```

## Concepts

Cache invalidation · Stale-while-revalidate · ETag vs Cache-Control · HTTP/3 & QUIC ·
Backpressure · AbortController · Streaming fetch · Priority hints · SameSite cookies ·
Speculative prerendering.

## Notes on the demos

The browser sandbox can't fake real servers/CDNs, so the demos use **deterministic simulations
with real APIs where possible**:

- **Cache invalidation / SWR / ETag** simulate a versioned server + cache so HIT/MISS/304/stale
  states are visible and reproducible.
- **HTTP/3** animates packet delivery for the same loss event over TCP (HoL blocking stalls all
  streams) vs QUIC (only the lossy stream waits); it also reads this page's real
  `nextHopProtocol`.
- **Backpressure** races a fast producer against a slow consumer with/without honoring the
  high-water mark — watch the queue stay bounded or blow up.
- **AbortController** runs a genuinely cancelable task with `AbortSignal.any` + `timeout`,
  distinguishing `AbortError` / `TimeoutError` from real failures.
- **Streaming fetch** uses a real `ReadableStream` + `TextDecoder` to contrast buffered vs
  token-by-token rendering (with mid-stream abort).
- **Priority hints** schedules the same resources under default vs hinted priorities and shows
  when the LCP image completes.
- **SameSite** is a live decision table across Strict/Lax/None, including the same-site-but-
  cross-origin and Public-Suffix-List edge cases.
- **Speculative prerendering** speculates on hover (`eagerness: moderate`) and measures
  click-to-content for none/prefetch/prerender.
