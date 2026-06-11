# Largest Contentful Paint (LCP)

## What LCP measures

**LCP** is the Core Web Vital for **loading speed**: the render time of the **largest content element
visible in the viewport** during load — measured relative to navigation start. It's the moment the
page's main content has *probably* appeared. **Good ≤ 2.5 s**, "needs improvement" ≤ 4 s, **poor > 4
s** (field, at the 75th percentile).

Eligible LCP elements: `<img>`, `<image>` inside `<svg>`, `<video>` (poster/first frame), an element
with a CSS `background-image`, and **block-level text** nodes. The largest by visible area wins.

## Candidates evolve, then freeze

LCP isn't a single event — the browser reports a **series of candidates**. As bigger content paints,
the candidate updates to the new largest, and its time becomes the running LCP:

```
t=0.3s  heading paints      → candidate: heading
t=0.7s  text block paints   → candidate: text block (bigger)
t=1.4s  hero image paints   → candidate: hero image (biggest)  ← LCP = 1.4s
```

Two important rules:
- **The final LCP is the last candidate before the first user interaction.** Any scroll/tap/keypress
  **freezes** LCP (after interacting, "largest content" is no longer meaningful).
- A late-but-large element **pushes LCP later** — which is why a heavy hero image dominates the score.

```js
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const last = entries[entries.length - 1]; // most recent (largest-so-far) candidate
  report('LCP', last.startTime, last.element);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

## The four sub-parts (where to optimize)

LCP time decomposes into:

1. **TTFB** — time to first byte (server + network). Often the biggest chunk.
2. **Resource load delay** — gap between TTFB and when the LCP resource *starts* loading (discovery
   problem: it's hidden in CSS, lazy-loaded, or low priority).
3. **Resource load time** — downloading the LCP image itself.
4. **Element render delay** — between resource loaded and painted (render-blocking CSS/JS).

## Fixes by sub-part

- **TTFB:** CDN, caching, edge, faster server; streaming SSR (level 7/8).
- **Load delay:** make the LCP image **discoverable & prioritized** — put it in the initial HTML,
  `fetchpriority="high"`, **`<link rel="preload">`**, and **never** `loading="lazy"` on the LCP image.
- **Load time:** right-size & modern formats (AVIF/WebP), responsive `srcset`, compression.
- **Render delay:** cut render-blocking resources, inline critical CSS, defer non-critical JS,
  preconnect to image origins.

## Senior checklist

- LCP = render time of the largest viewport element (image/text/video/bg-image), good ≤ 2.5 s; it's
  a series of **candidates** that **freeze on first input**.
- A heavy/late hero element dominates LCP — make it discoverable and high-priority; never lazy-load
  the LCP image.
- Diagnose via the **four sub-parts** (TTFB / load delay / load time / render delay) and fix the
  dominant one.
- Read it from `largest-contentful-paint` entries (`buffered: true`); the last entry is the LCP.

## References

- [web.dev: Largest Contentful Paint (LCP)](https://web.dev/articles/lcp)
- [web.dev: Optimize LCP](https://web.dev/articles/optimize-lcp)
- [web.dev: LCP sub-parts](https://web.dev/articles/optimize-lcp#lcp-breakdown)
- [MDN: LargestContentfulPaint](https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint)
