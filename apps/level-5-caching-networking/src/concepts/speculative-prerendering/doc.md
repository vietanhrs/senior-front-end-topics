# Speculative prerendering

## The idea: spend resources on a guess

If you can predict the user's **next navigation**, you can do its work **before the click** — so
the navigation feels instant. The spectrum of speculation, by cost & payoff:

```
dns-prefetch < preconnect < prefetch (resources) < prefetch (document) < PRERENDER
   cheapest                                                              full page built
                                                                          in a hidden tab
```

**Prerendering** is the maximal bet: the browser **fully loads and renders** the predicted page in
an invisible background context — HTML, subresources, scripts, layout. On click, it just
**activates** the already-rendered page: near-0ms LCP.

## The Speculation Rules API

The modern, standard way (replacing legacy `<link rel="prerender">`):

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": { "href_matches": "/products/*" },
    "eagerness": "moderate"
  }],
  "prefetch": [{
    "where": { "selector_matches": ".nav a" },
    "eagerness": "conservative"
  }]
}
</script>
```

- **`prefetch`** (document): fetches the next page's **HTML** only — cheap, renders on click.
- **`prerender`**: fetches **and renders** the whole page — expensive, instant on click.
- **`eagerness`** controls *when* the speculation fires:
  - `immediate`/`eager`: as soon as the rule matches (very speculative).
  - `moderate`: on **hover** (~200ms) over the link — high intent, the sweet spot.
  - `conservative`: on **pointerdown** — almost certain, still saves ~100–200ms.
- `where` supports URL patterns and CSS selectors — declarative targeting of whole link groups.

## What a prerendered page experiences

The page runs in a hidden context with real quirks you must handle:

- `document.prerendering === true`; the **`prerenderingchange`** event fires on activation.
- **Deferred APIs**: some things (camera, notifications, some storage prompts) are postponed until
  activation.
- **Analytics hazard**: your pageview beacon fires during *speculation*, not *viewing* → inflated
  metrics for pages never seen. Gate it:

```js
if (document.prerendering) {
  document.addEventListener('prerenderingchange', sendPageview, { once: true });
} else {
  sendPageview();
}
```

- Server side: speculative requests carry **`Sec-Purpose: prefetch;prerender`** — don't run
  side effects (rate limits, "viewed" markers) for them.

## Cost discipline

Every prerender costs **bandwidth + CPU + memory** (it's a whole hidden page; browsers cap
concurrent prerenders, e.g. Chrome ~10 for immediate, fewer effective). Wrong guesses are pure
waste — and hostile on metered data. Heuristics:

- Prerender only **high-probability** next steps: search → top result, list → detail on hover,
  login → dashboard.
- Prefer `moderate` (hover) eagerness — intent signal at near-zero misprediction cost.
- Respect `Save-Data` / data-saver users (browsers mostly do this for you).
- Personalized/stateful pages: prerendered content can go stale; revalidate on activation.

## Relationship to the rest of the stack

- This is the navigation-level big sibling of Level 1's resource hints (`prefetch` resources vs
  prefetch/prerender *documents*).
- SPA equivalent: route-chunk prefetch + data prefetch on hover (React Query `prefetchQuery`,
  router `loader` prefetch) — same philosophy inside one document.
- Chrome's **bfcache** (back/forward cache) gives instant *back* navigation for free — make sure
  you don't break it (`unload` handlers kill it); speculation rules cover *forward* guesses.

## Senior checklist

- Speculation ladder: preconnect → prefetch doc → prerender; pay more for more certainty.
- Speculation Rules API: `where` + `eagerness` (`moderate`/hover is the sweet spot).
- Gate analytics & side effects on `document.prerendering` / `Sec-Purpose` header.
- Budget it: high-probability links only, respect data saver, revalidate stale personalized content.

## Angular equivalent

Angular's SPA equivalent is route preloading, @defer (...; prefetch ...), data prefetch in services/resolvers, and cautious analytics gating. As in React, prefetch only when intent is strong enough and the extra bytes will not hurt current-page LCP/INP.

## References

- [Chrome: Speculation Rules API (prerender pages)](https://developer.chrome.com/docs/web-platform/prerender-pages)
- [MDN: Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
- [web.dev: bfcache](https://web.dev/articles/bfcache)
- [MDN: Sec-Purpose header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Purpose)
