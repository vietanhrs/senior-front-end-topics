# Stale-while-revalidate (SWR)

## The idea

**Stale-while-revalidate** resolves the freshness-vs-speed tension by doing both: **serve the
cached (possibly stale) value immediately**, and **revalidate in the background**; when fresh data
arrives, update the cache (and, on the client, the UI). The user never waits on the network for
content they've seen before, and staleness self-heals.

```
request ──▶ cache has entry?
              ├─ fresh        → serve it. done.
              ├─ stale (within SWR window)
              │     → serve stale NOW + fire background revalidation → update cache/UI
              └─ miss / too old → block on network (normal fetch)
```

## SWR at the HTTP layer

It's literally a `Cache-Control` extension (RFC 5861):

```
Cache-Control: max-age=60, stale-while-revalidate=300
```

- For 60s the response is **fresh** — served from cache, no network.
- For the next 300s it's **stale but usable**: the cache serves it instantly **and** revalidates
  asynchronously; the next request gets the updated copy.
- After that, the cache must block on revalidation like a normal expired entry.

Its sibling `stale-if-error=600` says: if revalidation **fails** (origin down), keep serving the
stale copy for up to 600s — graceful degradation. CDNs (and some browsers) implement both.

## SWR at the application layer (SWR / React Query)

The same pattern is the heart of client data libraries — the **stale-while-revalidate UI
pattern**:

1. Component mounts → show **cached data instantly** (even stale) → no spinner.
2. Library **revalidates** (refetch) in the background.
3. Fresh response → cache updated → component re-renders with new data.

```tsx
// React Query: staleTime = "fresh window", refetch happens in background after it
const { data, isFetching } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 60_000,   // fresh for 1 min: no refetch at all
});
// data is served from cache immediately; isFetching signals background revalidation
```

Revalidation triggers worth knowing: mount, window focus, network reconnect, interval — all
configurable. This is why apps with React Query feel instant: navigation shows cached pages,
updates trickle in behind.

## UX considerations

- **Show stale content honestly**: a subtle "updating…" indicator (or `isFetching`) beats a
  spinner replacing perfectly good content.
- **Avoid layout jumps** when fresh data lands (stable keys, reserve space, transition).
- **Don't SWR everything**: for correctness-critical reads (account balance before a transfer),
  block for fresh data instead.
- **Dedupe**: concurrent components requesting the same key should share one revalidation (the
  libraries do this; hand-rolled caches must).

## Relationship to the other caching concepts

- SWR is an **invalidation pragmatic**: instead of *deciding* perfectly when to invalidate, accept
  bounded staleness and repair continuously.
- It composes with **ETag** revalidation: the background refetch can be a conditional request that
  usually returns 304 — cheap.
- It is *not* optimistic UI: SWR is about reads (serve old while fetching new); optimistic UI is
  about writes (show expected result before confirmation).

## Senior checklist

- SWR = serve stale instantly + revalidate in background; staleness is bounded and self-healing.
- Know the header: `Cache-Control: max-age=N, stale-while-revalidate=M` (+ `stale-if-error`).
- Client-side: this is React Query/SWR's core model (`staleTime`, focus/reconnect revalidation, dedupe).
- Use a background-update indicator; don't SWR correctness-critical reads.

## References

- [RFC 5861: stale-while-revalidate & stale-if-error](https://datatracker.ietf.org/doc/html/rfc5861)
- [web.dev: Keeping things fresh with stale-while-revalidate](https://web.dev/articles/stale-while-revalidate)
- [SWR (Vercel): docs](https://swr.vercel.app/)
- [TanStack Query: important defaults (staleTime)](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
