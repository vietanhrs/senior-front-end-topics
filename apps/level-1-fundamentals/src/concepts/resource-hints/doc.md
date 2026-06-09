# Preload vs Prefetch vs Preconnect (Resource Hints)

Resource hints tell the browser **in advance** that we'll need something, so it can prepare
early. Used well → lower latency; used wrong → wasted bandwidth and **contention** with the
resources that actually matter.

## Core comparison

| Hint | Purpose | Priority | When to use |
|---|---|---|---|
| `preconnect` | Set up a **connection** ahead (DNS + TCP + TLS) to an origin | — | You're sure you'll fetch from a third-party origin (font, CDN, API) |
| `dns-prefetch` | Resolve **DNS** only, ahead of time (cheaper than preconnect) | — | Fallback for old browsers, or many origins needing just DNS |
| `preload` | Fetch a **specific resource** of the **current** page early, high priority | high | A critical resource discovered late (font, LCP image, critical CSS/JS) |
| `prefetch` | Pre-fetch a resource for a **future navigation**, very low priority | lowest | A resource for a page/route the user *might* go to next |
| `modulepreload` | Like preload but for an **ES module** (parse + add to the module map) | high | Critical JS modules |

## `preconnect` — save connection round-trips

Connecting to a new origin costs a DNS lookup + TCP handshake + TLS handshake — potentially
hundreds of ms. If you know you'll fetch from that origin, open the connection early:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" /> <!-- fallback -->
```

> Only preconnect to **origins you're sure you'll use** (limit to a handful). Opening spare
> connections wastes resources and the browser may close them before they're used.

## `preload` — "I need this early, for THIS page"

The browser discovers some resources late (a font declared in CSS, an image referenced in
JS). `preload` raises the priority and starts fetching immediately:

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
```

- **`as` is required** (font, image, script, style, fetch…) so the browser sets the right
  priority, applies the right CSP, and **reuses** the loaded connection/object.
- Fonts need `crossorigin` (fonts are always fetched in CORS mode).
- A bad preload (fetched but unused within a few seconds) → console warning + wasted bandwidth.

## `prefetch` — "might need it for a LATER page"

Lowest priority, for future navigations (the next route, the next product page's images):

```html
<link rel="prefetch" href="/next-page.js" as="script" />
```

The browser fetches only when idle and stores it in the HTTP cache for the next navigation.
**Don't** use prefetch for a resource needed now on the current page (use preload).

## Quick "preload vs prefetch"

- **preload** = *this page, right now, high priority*.
- **prefetch** = *a future page, when idle, low priority*.

The classic mix-up: using `prefetch` for the current page's font → the font loads late, still
causing FOIT/FOUT; or `preload`-ing a next-page resource → it contends with current-page
resources.

## `fetchpriority` & Priority Hints

The `fetchpriority="high|low|auto"` attribute (on `<img>`, `<link>`, `fetch()`) fine-tunes
priority within the same type — e.g. boost the LCP image, lower below-the-fold images.
(Deeper dive in Level 5 — "Priority hints".)

## Senior checklist

- Cleanly distinguish preconnect (connection) vs preload (current-page resource) vs prefetch
  (future page).
- `preload` always has `as`; fonts need `crossorigin`.
- Only preconnect to a few origins you'll definitely use; avoid spare hints that cause contention.
- Know the consequences of misuse (warnings, waste, FOUT).

## References

- [web.dev: Preload, prefetch and other link types](https://web.dev/articles/preload-responsive-warning)
- [MDN: rel=preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)
- [MDN: rel=preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect)
- [web.dev: Establish network connections early (preconnect)](https://web.dev/articles/preconnect-and-dns-prefetch)
- [web.dev: fetchpriority](https://web.dev/articles/fetch-priority)
