# ETag vs Cache-Control

## Two different questions

These headers answer **different questions** and work best together:

- **`Cache-Control`** answers: *"How long may you use this WITHOUT asking me?"* (freshness)
- **`ETag`** answers: *"You're asking — is your copy still correct?"* (validation)

```
Within max-age:    cache → serve directly.        0 round trips.   (Cache-Control)
After max-age:     cache → "If-None-Match: ..." → server
                      ├─ unchanged → 304 Not Modified (no body)    (ETag wins: tiny)
                      └─ changed   → 200 + new body + new ETag
```

## Cache-Control — the freshness contract

Key directives (response side):

| Directive | Meaning |
|---|---|
| `max-age=N` | fresh for N seconds (browser + shared caches) |
| `s-maxage=N` | overrides `max-age` for **shared** caches (CDN) only |
| `no-cache` | **may store**, but must revalidate before every use (≠ don't cache!) |
| `no-store` | never store anything (sensitive data) |
| `private` / `public` | only browser cache / also shared caches |
| `immutable` | content at this URL will never change — skip revalidation even on reload |
| `stale-while-revalidate=N` | serve stale while refreshing (previous concept) |

> The classic misconception: **`no-cache` does not mean "don't cache"** — it means "cache, but
> always revalidate". "Don't cache" is `no-store`.

## ETag — the cheap validator

The server tags each response with an opaque version id:

```
HTTP/1.1 200 OK
ETag: "v42-abc123"
Cache-Control: max-age=0, no-cache
```

When the cached copy needs revalidating, the browser sends a **conditional request**:

```
GET /api/products
If-None-Match: "v42-abc123"
```

- Unchanged → **`304 Not Modified`**, empty body. You paid one round trip (~latency), but not the
  transfer (could be megabytes). The cache "refreshes" its copy's lifetime.
- Changed → `200` with the new body and new ETag.

`Last-Modified`/`If-Modified-Since` is the timestamp-based equivalent — coarser (1s resolution,
problematic with generated content); ETag wins when both are present.

**Strong vs weak ETags**: `"abc"` = byte-identical guarantee; `W/"abc"` = semantically equivalent
(OK for most caching; not for byte-range requests).

> Gotcha: default ETags from some servers (inode-based Apache/nginx configs) differ **per server
> instance** — behind a load balancer they break revalidation. Use content-hash ETags.

## How they compose — the canonical recipe

```
# Hashed static assets (app.3f9c2b.js): never ask again
Cache-Control: public, max-age=31536000, immutable

# HTML entry point: always ask, but cheaply (304 most of the time)
Cache-Control: no-cache
ETag: "<content-hash>"

# API reads: short freshness + background refresh + cheap validation
Cache-Control: max-age=30, stale-while-revalidate=300
ETag: "<version>"

# Sensitive/personal: nothing stored anywhere
Cache-Control: no-store
```

ETags also do double duty for **optimistic concurrency** on writes: `If-Match: "v42"` on a `PUT`
fails with `412 Precondition Failed` if someone else changed the resource — a free conflict
detector.

## Senior checklist

- `Cache-Control` = how long to skip the network; `ETag` = how to revalidate cheaply (304).
- `no-cache` ≠ `no-store`; `immutable` + hashed URLs = cache forever; `s-maxage` for CDNs.
- 304 saves the body, not the round trip — it complements, not replaces, freshness.
- Content-hash your ETags (multi-instance safe); know `If-Match` for write conflicts.

## References

- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [MDN: ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- [MDN: HTTP conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)
- [web.dev: HTTP cache — your first line of defense](https://web.dev/articles/http-cache)
