# Same-origin policy (SOP) nuances

## The foundation

The **same-origin policy** is the browser's core isolation boundary: script from one **origin**
can't read data from another origin. An **origin** is the tuple **(scheme, host, port)** — *all
three* must match:

```
https://app.example.com           (https, app.example.com, 443)
  vs https://app.example.com:8443 → DIFFERENT (port)
  vs http://app.example.com       → DIFFERENT (scheme)
  vs https://api.example.com      → DIFFERENT (host — subdomain counts!)
  vs https://app.example.com/x    → SAME (path/query/fragment don't matter)
```

> **Origin ≠ site.** A *site* is the registrable domain (eTLD+1), used by SameSite cookies (Level
> 5). `app.example.com` and `api.example.com` are the **same site** but **different origins**. SOP
> works on origins; SameSite works on sites — don't conflate them.

## What SOP actually gates (and what it doesn't)

| Interaction | Cross-origin? |
|---|---|
| Reading another frame's DOM (`iframe.contentWindow.document`) | ❌ blocked |
| Reading a cross-origin `fetch`/XHR **response body** in JS | ❌ blocked unless **CORS** allows it |
| Reading another origin's `localStorage`/`IndexedDB` | ❌ blocked (storage is per-origin) |
| **Sending** a cross-origin request | ✅ allowed (the *response read* is what's gated) |
| Embedding cross-origin **images/media/scripts/styles** | ✅ allowed (but opaque — can't read pixels/source) |
| Submitting a cross-origin **form** | ✅ allowed (basis of CSRF — Level 1/5) |
| `postMessage` between windows | ✅ allowed (explicit, opt-in channel) |

The crucial subtlety: **SOP blocks *reading* cross-origin responses, not *making* the request.**
The request goes out (often *with* cookies); the browser just hides the response from JS. That's
why CSRF exists and why "no CORS header" still means your server did the work.

## The escape hatches (opt-in relaxations)

- **CORS** — the server opts in to letting specific origins read responses
  (`Access-Control-Allow-Origin`). The standard way to *intentionally* share data cross-origin
  (next concepts).
- **`postMessage`** — structured message passing between any two windows/workers; the receiver
  **must validate `event.origin`** (and ideally check `event.source`). The safe cross-origin RPC.
- **`crossorigin` attribute + CORS** — to *read* cross-origin `<img>`/`<canvas>` pixels, `<script>`
  error details, or fonts, the resource must be served with CORS and tagged `crossorigin`.
- **CORP / COEP / COOP** — newer response headers that *tighten* embedding/isolation
  (`Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`).
  COOP+COEP enable **cross-origin isolation**, a prerequisite for `SharedArrayBuffer` (next concept).

## Deprecated / footguns

- **`document.domain`** — historically two pages sharing a parent domain could set
  `document.domain = 'example.com'` to become "same origin". This is **deprecated and disabled by
  default** under cross-origin isolation; don't design around it. Use `postMessage`.
- **Subdomain ≠ same origin.** A common bug: assuming `app.example.com` can script
  `widget.example.com`'s frame. It can't (different host) — even though cookies may be shared via
  `Domain=.example.com`.
- **`file://`** origins are opaque/per-file in most browsers — local testing surprises.
- **Opaque origins** (sandboxed iframes without `allow-same-origin`, `data:`/`blob:` documents)
  match *nothing* — `localStorage` throws, `fetch` is anonymous.

## Senior checklist

- Origin = (scheme, host, port); all three must match; path doesn't. Subdomains/ports/scheme differ → cross-origin.
- SOP blocks **reading** cross-origin responses & DOM/storage, not **sending** requests (→ CSRF).
- Relax intentionally via CORS (data) and `postMessage` (windows) — and **validate `event.origin`**.
- `document.domain` is deprecated; origin ≠ site (SameSite); COOP/COEP enable cross-origin isolation.

## References

- [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [MDN: Window.postMessage (validate origin!)](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [web.dev: Cross-origin isolation (COOP/COEP)](https://web.dev/articles/coop-coep)
- [MDN: Cross-Origin-Resource-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy)
