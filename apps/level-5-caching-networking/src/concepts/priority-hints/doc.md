# Priority hints (fetchpriority)

## Where priorities come from

The browser assigns every request a **priority** (Highest…Lowest, visible in the DevTools Network
panel) based on heuristics: resource type, position in the document, whether it's render-blocking,
viewport proximity:

| Resource | Typical default |
|---|---|
| HTML, CSS in `<head>`, fonts | Highest/High |
| Sync scripts | High; `defer`/`async` → Low(er) |
| Images | **Low**, bumped to High *after layout* if in-viewport |
| `prefetch` resources | Lowest |
| `fetch()` API calls | High |

Heuristics are good but blind to *your* intent: the browser can't know the hero image **is** the
LCP element, or that the analytics call is junk-priority.

## `fetchpriority`: telling the browser what matters

**Priority hints** let you adjust priority *within* those heuristics: `fetchpriority="high" |
"low" | "auto"` on priority-aware elements such as `<img>`, `<link>`, and `<script>`. Some
browsers also expose `priority: 'high' | 'low' | 'auto'` on `fetch()` / `RequestInit`, but treat
that as progressive enhancement because support is newer and not universal:

```html
<!-- LCP hero: images default to Low until layout — start it High immediately -->
<img src="/hero.jpg" fetchpriority="high" />

<!-- Below-the-fold carousel images: don't compete with critical work -->
<img src="/carousel-2.jpg" fetchpriority="low" loading="lazy" />

<!-- Late-discovered LCP image via preload + high priority -->
<link rel="preload" as="image" href="/hero.jpg" fetchpriority="high" />
```

```js
// Critical data for first render
fetch('/api/products', { priority: 'high' });
// Analytics/logging: never compete with real work
fetch('/analytics', { priority: 'low' });
```

It's a **hint, not a command** — the browser may ignore it; unsupported browsers just skip the
attribute (safe progressive enhancement).

Avoid teaching this as a universal attribute for every fetch-producing element. Check current
browser support before using it on less common elements, and always verify the actual request
priority in DevTools.

## The flagship use case: LCP images

Images start **Low** and only get bumped after the browser learns they're in-viewport (post
layout). For the LCP image that delay is pure lost time. `fetchpriority="high"` removes it —
Google measured **LCP improvements of hundreds of ms** from this one attribute. Conversely,
`fetchpriority="low"` on above-the-fold-but-unimportant images (badges, avatars) frees bandwidth
for what matters.

## Relationship to other mechanisms (don't confuse)

- **`preload`** (Level 1) controls **discovery** — *start this request early*. `fetchpriority`
  controls **competition** — *how important is it vs others*. They compose:
  `<link rel="preload" fetchpriority="high">`.
- **`loading="lazy"`** controls **whether/when** to request at all (viewport-gated).
- **`async/defer`** control script **execution**; priority affects download scheduling.
- **HTTP/2/3 stream priorities**: `fetchpriority` feeds into the protocol-level prioritization the
  browser sends.

## Practical guidance

- Mark **exactly one** thing high per page region — if everything is high, nothing is.
  Most pages need: hero/LCP image `high`, analytics/non-critical fetches `low`, the rest `auto`.
- Verify in DevTools → Network → **Priority column** (enable it) — check before/after.
- Lighthouse's "Largest Contentful Paint element" + "Preload LCP image" audits tell you where to
  apply it.

## Senior checklist

- Browsers schedule by heuristic priority; `fetchpriority` adjusts supported elements and some
  `fetch()` calls.
- #1 win: `fetchpriority="high"` on the LCP image (skips the Low-until-layout phase).
- Demote competing noise (`low` on analytics, below-fold media) — as valuable as promoting.
- It's a hint; verify in the Network panel's Priority column. Don't mark everything high.

## References

- [web.dev: Optimizing resource loading with fetchpriority](https://web.dev/articles/fetch-priority)
- [MDN: fetchpriority attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#fetchpriority)
- [Chrome: resource loading priorities explained](https://web.dev/articles/fetch-priority#browser_priority_and_fetchpriority)
- [MDN: fetch() priority option](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#priority)
