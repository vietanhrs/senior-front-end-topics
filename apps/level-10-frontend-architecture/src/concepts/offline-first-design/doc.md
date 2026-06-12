# Offline-first design

## The inversion

Most apps treat the network as a **requirement**: every read and write hits the server, and "offline"
is an error state. **Offline-first** (a.k.a. **local-first**) inverts that: the **local store is the
source of truth for the UI**, and the network is a **background sync** that's nice to have. The app
is fully usable on a plane, a subway, or flaky 3G — and feels instant because reads/writes are local.

```
read:   UI ⇠ local store (instant)        ⇠ background refresh from server
write:  UI ⇢ local store (instant)  ⇢ outbox queue ⇢ replay to server when online
```

## The building blocks

### 1. App shell + assets cached (Service Worker)
A **Service Worker** caches the app shell and static assets so the app **boots offline**. Runtime
caching strategies per resource type:
- **Cache-first** — static, versioned assets (fast, offline).
- **Network-first** — frequently changing data (fresh when online, cached fallback offline).
- **Stale-while-revalidate** — show cached instantly, update in background (level 5).

### 2. Local data store (IndexedDB)
Structured app data lives in **IndexedDB** (previous concept) so reads are local and large datasets
work offline. The UI renders from here, not from the network.

### 3. The outbox (write queue)
Writes made offline can't reach the server, so you **queue** them locally and **replay** when
connectivity returns:
- Apply the mutation **optimistically** to the local store (UI updates instantly).
- Append the mutation to a durable **outbox** (in IndexedDB).
- On reconnect, **flush** the outbox in order; on success, mark records synced; on failure, retry.
- Use the **Background Sync API** (`registration.sync.register(...)`) so the *Service Worker* can
  flush even after the tab is closed.

### 4. Idempotency (the part that bites)
Replay can happen more than once (retries, duplicate tabs, flaky acks). Give each queued mutation a
**client-generated id / idempotency key** so the server can dedupe — replaying twice must not create
two orders. This is what makes the outbox safe.

### 5. Detecting connectivity
`navigator.onLine` + the `online`/`offline` events are useful but **lie** (captive portals, "online"
but no real connectivity). Treat them as hints; the real signal is a **failed/succeeded request**.
The Network Information API (`navigator.connection`) hints at quality for adaptive loading.

## UX

Make state visible: an offline indicator, "queued"/"pending sync" badges on optimistic items, and a
sync status. Never silently drop a user's action — show that it's saved locally and will sync.

## Senior checklist

- Offline-first = **local store is the UI's source of truth**; the network syncs in the background.
  Reads/writes are local → instant and offline-capable.
- Cache the shell/assets with a **Service Worker** (cache-first / network-first / SWR per resource);
  keep data in **IndexedDB**.
- Queue offline writes in a durable **outbox**, apply optimistically, **replay on reconnect**
  (Background Sync for closed tabs), with **idempotency keys** so replays don't duplicate.
- `navigator.onLine`/events are hints, not truth; reconcile conflicts on sync (next concept) and make
  sync state visible in the UI.

## References

- [web.dev: Offline cookbook / caching strategies](https://web.dev/articles/offline-cookbook)
- [MDN: Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Local-first software (Ink & Switch)](https://www.inkandswitch.com/local-first/)
- [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
