# CORS preflight

## Background: the Same-Origin Policy

By default the browser blocks JS from reading a **response** from a different origin
(different scheme/host/port). **CORS** (Cross-Origin Resource Sharing) is the mechanism by
which the **server** explicitly allows another origin to read a response, via
`Access-Control-*` headers.

> Note: CORS protects at the level of **JS reading the response**. The request may still be
> sent (for "simple requests"); what's blocked is JS reading the result if the server doesn't
> allow it.

## Simple request vs preflighted request

The browser divides cross-origin requests into two groups:

### "Simple request" — NO preflight
Sent directly, with an `Origin` header. Conditions (must satisfy **all**):

- Method ∈ { `GET`, `HEAD`, `POST` }.
- Only "safe" author-set headers: `Accept`, `Accept-Language`, `Content-Language`,
  `Content-Type`, `Range` (and a few CORS-safelisted headers, with value restrictions).
- `Content-Type` ∈ { `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` }.
- No `ReadableStream` upload; no event listeners on `XMLHttpRequestUpload`.

### Preflighted request — HAS a preflight
If the conditions above are **not** met (e.g. `PUT`/`DELETE`, a custom `Authorization` header,
`Content-Type: application/json`, an `X-*` header…), the browser **automatically** sends an
`OPTIONS` request first to "ask permission".

```
JS calls fetch(PUT, Content-Type: application/json, X-Token: ...)
        │
        ▼  (browser sends this; JS never sees it)
OPTIONS /api  ───────────────▶  Server
  Origin: https://app.example
  Access-Control-Request-Method: PUT
  Access-Control-Request-Headers: content-type, x-token
        ◀───────────────  Server's preflight response:
  Access-Control-Allow-Origin: https://app.example
  Access-Control-Allow-Methods: PUT, POST, GET
  Access-Control-Allow-Headers: content-type, x-token
  Access-Control-Max-Age: 600
        │  (if valid)
        ▼
PUT /api  ───────────────────▶  the REAL request is finally sent
```

A `json` body is the most common reason REST APIs always trigger a preflight:
`Content-Type: application/json` isn't on the safelist.

## Important CORS headers

| Response header | Meaning |
|---|---|
| `Access-Control-Allow-Origin` | the allowed origin (`*` or a specific origin) |
| `Access-Control-Allow-Methods` | allowed methods (returned on the preflight response) |
| `Access-Control-Allow-Headers` | allowed custom headers |
| `Access-Control-Allow-Credentials` | `true` if cookies/credentials are allowed |
| `Access-Control-Max-Age` | cache the preflight result (seconds) → avoid re-OPTIONS |
| `Access-Control-Expose-Headers` | which response headers JS is allowed to read |

## Credentials (cookies) make the rules stricter

With `fetch(url, { credentials: 'include' })`:

- `Access-Control-Allow-Origin` **must not** be `*` — it must be a specific origin.
- `Access-Control-Allow-Credentials: true` is required.
- `Access-Control-Allow-Headers`/`Methods` can't use `*` either (wildcards are ignored when
  credentials are present).

## Optimization

- **`Access-Control-Max-Age`**: cache the preflight so you don't OPTIONS every time (browsers
  have their own cap, e.g. Chrome ~2 hours).
- **Avoid unnecessary headers/`Content-Type`** to keep a request "simple" when possible.
- **Consolidate endpoints** to reduce the number of origins/preflights.

## Pitfalls

- Thinking `OPTIONS` is sent by your code — it isn't, **the browser sends it**.
- The server forgets to handle `OPTIONS` → the preflight fails → the real request never runs.
- A CORS error shows in the Console but **the request still reached the server** (the server
  still processed it!) — important for side-effecting operations: a "simple" POST still runs
  on the server even if JS can't read the response.
- `mode: 'no-cors'` → an **opaque** response, body/status unreadable; it's not a way to
  "bypass CORS".

## Senior checklist

- State the simple vs preflighted conditions correctly (especially `Content-Type:
  application/json`).
- Know the preflight is an OPTIONS the browser sends automatically, and the response headers it
  needs.
- Understand the constraints when `credentials: include` (no `*`).
- Know `Access-Control-Max-Age` to reduce preflights.

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
- [Fetch Standard: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [MDN: CORS-safelisted request header](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header)
