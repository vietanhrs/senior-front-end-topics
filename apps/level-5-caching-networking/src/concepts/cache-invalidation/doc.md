# Cache invalidation strategies

> "There are only two hard things in Computer Science: cache invalidation and naming things." —
> Phil Karlton. This concept is about making the first one tractable.

## The problem

A cache trades **freshness for speed**. Every cache you add (HTTP cache, CDN, Service Worker
cache, in-memory query cache) creates the same question: **when is the cached copy wrong, and how
does it get fixed?** An invalidation strategy is the explicit answer. "We'll clear it when there
are bugs" is not a strategy.

## The strategy toolbox

### 1. TTL / expiration (time-based)
Cache entries carry a lifetime (`Cache-Control: max-age=300`, query `staleTime`). Simple,
predictable, but inherently a guess: too short → cache useless; too long → users see stale data
for up to the TTL.

- Use when staleness has a known, acceptable bound (config, product lists, avatars).

### 2. Key-based / cache busting (immutable artifacts)
Don't invalidate — **change the key**. Hashed filenames (`app.3f9c2b.js`) + `Cache-Control:
immutable, max-age=31536000` mean the content for a given URL **never changes**; deploys produce
new URLs. The old entry doesn't need invalidating; it just stops being referenced.

- This is how bundlers (Vite/webpack) make "cache forever" safe, and the gold standard for static
  assets. The only mutable resource left is the HTML that points at the hashes (keep it
  `no-cache`).

### 3. Validation / conditional requests
Keep the entry but **revalidate** it cheaply: `ETag`/`Last-Modified` + `If-None-Match` →
`304 Not Modified` (no body) when unchanged. You pay a round trip but not the transfer. (Full
treatment in "ETag vs Cache-Control".)

### 4. Event-driven / explicit invalidation
The writer **tells** caches what changed:

- **Mutation-keyed invalidation** (client): after `POST /todos`, invalidate the `['todos']` query
  key → refetch. React Query/SWR formalize this: caches are keyed, mutations invalidate keys.
- **Purge/surrogate keys** (CDN): tag responses (`Surrogate-Key: user-42`) and purge by tag on
  write.
- **Push invalidation**: WebSocket/SSE message tells clients "entity X changed" → drop/refetch.

Most precise, but requires knowing the **dependency graph**: which cached entries does this write
affect? Under-invalidate → stale bugs; over-invalidate → cache useless.

### 5. Stale-while-revalidate (serve stale, fix async)
Serve the cached value instantly *and* refresh in the background. A pragmatic hybrid — own concept
next.

## Choosing: a decision sketch

```
Content-addressed (hashed) artifact?        → key-based + immutable, cache forever
Read-mostly, bounded staleness OK?          → TTL (+ SWR for nicer UX)
Big payload, cheap to compare versions?     → ETag revalidation (304)
You control the writes & know dependencies? → event-driven (invalidate by key/tag)
```

Real systems **layer** these: immutable assets + no-cache HTML + SWR'd API reads + mutation-keyed
invalidation.

## Classic failure modes

- **Invalidate by clearing everything**: nukes hit rate, causes thundering-herd refetches.
- **Forgetting derived data**: invalidating `['todo', 5]` but not `['todos']` list that embeds it.
- **Caching errors**: a 500 cached for 5 minutes. Cache only success (or tiny TTL for errors).
- **Time skew**: TTLs computed from client clocks; prefer server-provided expiry.
- **Mutable content at an immutable URL** (editing a published asset in place) — breaks key-based
  caching's core assumption.

## Senior checklist

- Name the strategy per cache layer: TTL, key-based/immutable, validation, event-driven, SWR.
- Hashed assets → cache forever; the referencing HTML → always revalidate.
- Client caches should be **keyed**, and mutations should invalidate the affected keys.
- Watch for derived-data misses, cached errors, and "clear all" anti-patterns.

## Angular equivalent

Angular apps usually implement the same model in a service/store: cache by key, expose Observable or signal state, then invalidate keys after mutations. The UI consumes via async pipe or toSignal; route resolvers and service workers can add route/network-layer invalidation.

## References

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [web.dev: Love your cache (caching strategy)](https://web.dev/articles/love-your-cache)
- [TanStack Query: Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Fastly: Surrogate keys / purge by tag](https://docs.fastly.com/en/guides/working-with-surrogate-keys)
