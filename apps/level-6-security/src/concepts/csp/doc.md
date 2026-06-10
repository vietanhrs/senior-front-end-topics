# Content Security Policy (CSP)

## What CSP is

A **Content Security Policy** is an allow-list, delivered as an HTTP response header (or
`<meta>` tag), that tells the browser **which sources of content are trusted**. Its primary job
is to make **XSS far less exploitable**: even if an attacker injects a `<script>`, the browser
refuses to run it unless it matches the policy. CSP is *defense-in-depth* — it doesn't replace
output encoding/sanitization (Level 1), it limits the blast radius when those fail.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m';
  style-src 'self';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none'
```

## The directives that matter

| Directive | Controls | Notes |
|---|---|---|
| `default-src` | fallback for most `*-src` | set a restrictive baseline, then loosen per type |
| `script-src` | where JS can load/run from | the security-critical one |
| `style-src` | stylesheets & inline styles | `'unsafe-inline'` here is lower-risk but still avoid |
| `img-src`, `font-src`, `connect-src` | images, fonts, fetch/XHR/WS targets | `connect-src` gates exfiltration |
| `frame-ancestors` | who may iframe you | the modern anti-clickjacking control (replaces `X-Frame-Options`) |
| `base-uri` | `<base href>` | lock to `'none'`/`'self'` to stop base-tag hijacking |
| `object-src` | `<object>/<embed>` | set `'none'` (legacy plugin XSS vector) |
| `report-to` / `report-uri` | violation reporting endpoint | collect violations before enforcing |

## Source expressions

`'self'`, `'none'`, host patterns (`https://cdn.example.com`, `*.example.com`), schemes
(`https:`, `data:`), and the script-specific keywords:

- **`'unsafe-inline'`** — allows inline `<script>`/event handlers. This basically **defeats CSP's
  XSS protection**; avoid it for `script-src`.
- **`'unsafe-eval'`** — allows `eval`/`new Function`. Avoid; some libs need it (try to remove them).
- **`'nonce-<random>'`** — a per-response random token; only `<script nonce="...">` matching it
  runs. The nonce **must be unique per response** and unguessable.
- **`'sha256-<hash>'`** — allow a specific inline script by content hash (good for static inline).
- **`'strict-dynamic'`** — trust scripts loaded by an already-trusted (nonce'd) script, ignoring
  host allow-lists. The basis of a modern **strict CSP**.

## Strict CSP (the recommended shape)

Host allow-lists are notoriously bypassable (open redirects, JSONP endpoints, outdated libs on a
"trusted" CDN). Google's guidance is a **nonce + `strict-dynamic`** policy:

```
script-src 'nonce-{random}' 'strict-dynamic' https: 'unsafe-eval';
object-src 'none';
base-uri 'none';
```

- Every legit `<script>` gets the per-request nonce; injected scripts don't have it → blocked.
- `strict-dynamic` lets your bundler/loader pull in further scripts without enumerating hosts.
- `https:`/`'unsafe-eval'` are ignored by browsers that support `strict-dynamic` (they're fallbacks
  for older browsers).

## Rollout without breakage

1. **Report-Only first**: `Content-Security-Policy-Report-Only` + `report-to` — observe what
   *would* break, fix violations, don't block anything yet.
2. Tighten until reports are clean, then switch to the enforcing header.
3. Keep a reporting endpoint in production to catch regressions and real attacks.

## Common mistakes

- Shipping `script-src 'unsafe-inline'` (policy is now mostly decorative).
- Reusing a static nonce, or putting the nonce in a place an attacker can read and reflect.
- Forgetting `base-uri` (`<base>` injection redirects relative script URLs) and `object-src`.
- Relying only on a host allow-list (bypassable) instead of nonces/`strict-dynamic`.
- Putting `frame-ancestors` in a `<meta>` CSP — it's **ignored** there; it must be a real header.

## Senior checklist

- CSP is defense-in-depth for XSS: an allow-list of content sources, not a sanitizer replacement.
- Prefer a **strict CSP**: per-request `'nonce-…'` + `'strict-dynamic'`; avoid `'unsafe-inline'`/host-only.
- Always set `object-src 'none'`, `base-uri 'none'`, and `frame-ancestors` (header, not meta).
- Roll out via **Report-Only** + a reporting endpoint, then enforce.

## References

- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
- [web.dev: Strict CSP](https://web.dev/articles/strict-csp)
- [CSP Evaluator (Google)](https://csp-evaluator.withgoogle.com/)
- [W3C: CSP Level 3](https://www.w3.org/TR/CSP3/)
