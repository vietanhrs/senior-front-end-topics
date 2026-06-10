# Render waterfall

## What a waterfall is

A **waterfall** is the timeline of resource requests the browser makes to render a page, drawn as
staggered horizontal bars (exactly the **Network panel** view). A **render waterfall** is the
critical chain of those requests that gates the first meaningful paint. The shape of that chain —
how much is **sequential** vs **parallel** — often matters more than the size of any single file.

## Why chains form (request dependencies)

The browser can only request what it has **discovered**. Discovery is gated by parsing and
execution, creating dependency chains:

```
HTML ──▶ (parse) ──▶ CSS ──▶ (CSSOM) ──▶ @font-face URL ──▶ font
                 └─▶ JS  ──▶ (execute) ──▶ fetch('/api') ──▶ render data
```

Each arrow is a **round trip** (DNS+TCP+TLS the first time to a new origin, then request+response).
A deep chain means many sequential round trips before anything useful paints — even if every file
is tiny. This is the classic **"request chain" / critical-path latency** problem.

## The two enemies: depth and late discovery

- **Depth**: A→B→C→D serially. Total time ≈ sum of the chain, not the max. Each hop adds latency.
- **Late discovery**: a resource the browser only learns about *after* parsing CSS or running JS
  (fonts in CSS, images set by JS, data fetched after hydration). It starts late, so it finishes
  late — pushing out LCP.

A specially nasty case is **client-side data fetching after JS executes**: HTML → JS bundle →
hydrate → `fetch` → render. The data request can't even *start* until the bundle has downloaded and
run. That's a long, serial render waterfall.

## Flattening the waterfall

### Start things earlier (break "late discovery")
- **`preconnect`** to third-party origins you'll use (warm up DNS/TCP/TLS in parallel).
- **`preload`** late-discovered critical resources (LCP image, fonts, the data endpoint with
  `as="fetch"`), so they start immediately instead of after parse/JS.
- **`modulepreload`** critical JS modules.

### Remove hops / parallelize
- Avoid CSS `@import` (serializes CSS). Use parallel `<link>`s.
- Don't gate data on the JS bundle: **SSR/stream** the data, or **inline initial data**, or fire
  the fetch from the HTML (preload `as="fetch"`) so it overlaps the bundle download.
- Kick off independent fetches **in parallel** (`Promise.all`), not nested awaits (Level 1 —
  dynamic import; Level 2 — Suspense waterfalls).

### Reduce per-hop cost
- HTTP/2-3 multiplexing (many requests over one connection); fewer redirects; CDN/edge to cut RTT.

## Reading it

In the Network panel, look for the **staircase shape** (each request starting only when the prior
finishes) — that's a serial chain to flatten. The **"Initiator"** column and **request
dependencies** show what triggered each request. Lighthouse reports **"Avoid chaining critical
requests"** with the longest chains.

## Senior checklist

- Total critical-path time ≈ the **sum** of the dependency chain's round trips, not the biggest file.
- Attack **depth** (remove hops, parallelize) and **late discovery** (preload/preconnect, SSR/inline data).
- The "HTML → bundle → hydrate → fetch → render" chain is a top offender; start data early.
- Diagnose with the Network staircase + Lighthouse "chaining critical requests".

## References

- [web.dev: Avoid chaining critical requests](https://web.dev/articles/critical-request-chains)
- [web.dev: Preconnect & preload](https://web.dev/articles/preload-critical-assets)
- [web.dev: Optimize LCP (eliminate resource load delay)](https://web.dev/articles/optimize-lcp)
- [MDN: Network request waterfalls](https://developer.mozilla.org/en-US/docs/Web/Performance)
