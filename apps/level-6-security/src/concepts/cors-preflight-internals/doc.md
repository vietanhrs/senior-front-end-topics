# CORS preflight internals

> Level 1 covered *when* a preflight fires (simple vs preflighted). Here we go inside the
> **OPTIONS exchange itself**: the exact request/response header matching, credentials rules,
> caching, and the failure modes that produce the dreaded "blocked by CORS" with a 200 in the
> Network tab.

## The preflight request

For a non-simple request the browser sends, on its own, an `OPTIONS` to the same URL **with no
body** and three signalling headers:

```
OPTIONS /api/orders HTTP/1.1
Origin: https://app.example
Access-Control-Request-Method: PATCH
Access-Control-Request-Headers: content-type, x-trace-id
```

- `Access-Control-Request-Method` — the method the real request will use.
- `Access-Control-Request-Headers` — the lower-cased, sorted list of **non-safelisted** request
  headers the real request will send. (Safelisted ones — `accept`, `accept-language`,
  `content-language`, and `content-type` *with a safelisted value* — are not listed.)

## The preflight response — what the browser checks

The server must answer (2xx, typically 204) with headers the browser then validates **all** of:

| Response header | Must satisfy |
|---|---|
| `Access-Control-Allow-Origin` | equals the `Origin` (or `*` — but see credentials) |
| `Access-Control-Allow-Methods` | contains the requested method (or `*`) |
| `Access-Control-Allow-Headers` | contains **every** requested header (case-insensitive; or `*`) |
| `Access-Control-Allow-Credentials` | `true` **iff** the request is credentialed |
| `Access-Control-Max-Age` | (optional) seconds to cache this preflight result |

If any check fails, the browser **blocks the real request** — it never even sends it. The console
shows a CORS error; there's no response for your JS to read.

## The credentials rules (the strict ones)

When the request is credentialed (`fetch(..., { credentials: 'include' })`, or XHR
`withCredentials`):

- `Access-Control-Allow-Origin` **must be the exact origin**, never `*`.
- `Access-Control-Allow-Headers` / `-Methods` **`*` does NOT act as a wildcard** — you must list
  them explicitly.
- `Access-Control-Allow-Credentials: true` is required, or the browser discards the response.
- To let JS read non-safelisted **response** headers, the server must also send
  `Access-Control-Expose-Headers` (again, `*` is ignored when credentialed).

## Caching with `Access-Control-Max-Age`

A successful preflight can be cached so repeated calls skip the extra round trip:

```
Access-Control-Max-Age: 600
```

The cache key includes method + headers + origin. Browsers cap it (Chrome ~2h, Firefox ~24h);
`-1` / `0` disables caching (a preflight on *every* request — a real latency bug). Tuning this is a
common, high-leverage perf fix for chatty `application/json` APIs.

## The two-step nature & failure modes

Remember it's **two HTTP exchanges**: the OPTIONS, then (if it passes) the real request — each must
independently carry valid `Access-Control-Allow-Origin`. Classic bugs:

- Server handles OPTIONS but the **actual** response omits `Access-Control-Allow-Origin` → preflight
  passes, real request blocked.
- Reverse proxy/CDN strips CORS headers from `OPTIONS`, or returns `405`/`401` for it (auth
  middleware running before CORS) → preflight fails.
- Forgetting to echo a custom header in `Allow-Headers` (e.g. you add `Authorization` or
  `X-Trace-Id` later) → suddenly blocked.
- `Allow-Origin: *` **with** credentials → blocked; must echo the specific origin (and `Vary:
  Origin` so caches don't serve the wrong one).
- Missing `Max-Age` → a preflight before every call (correct, but slow).

## Senior checklist

- Preflight = `OPTIONS` advertising `Access-Control-Request-Method/-Headers`; server must allow the method + **every** requested header + the origin.
- Failure blocks the **real** request entirely (200 in Network ≠ readable in JS).
- Credentialed requests forbid `*` for Allow-Origin/Headers/Methods/Expose — list them, send `Allow-Credentials: true`, add `Vary: Origin`.
- Both the OPTIONS *and* the actual response need `Allow-Origin`; tune `Access-Control-Max-Age` to avoid per-request preflights.

## References

- [MDN: CORS — Preflighted requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests)
- [Fetch Standard: CORS-preflight fetch](https://fetch.spec.whatwg.org/#cors-preflight-fetch)
- [MDN: Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age)
- [MDN: Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)
