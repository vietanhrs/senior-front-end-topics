# IndexedDB scaling strategy

## What IndexedDB is

**IndexedDB** is the browser's built-in **transactional, asynchronous, object database** — the only
client storage built for **large, structured** data (tens of MB to GBs, vs `localStorage`'s ~5MB of
synchronous strings). It stores structured-cloneable values (objects, arrays, `Blob`s,
`ArrayBuffer`s, `Date`s) in **object stores**, queryable by key and by **indexes**. It's the backbone
of offline-first apps, big client caches, and local-first datasets.

It's powerful but low-level and awkward (event-based, easy to misuse), so most teams use a thin
wrapper: **`idb`** (promise wrapper) or **Dexie** (query layer). The scaling concerns below are what
separate a toy from a database that holds 100k records smoothly.

## Scaling strategies

### 1. Index what you query — don't scan
Without an index, "find all items where category = X" means loading **every** record and filtering in
JS. Create an **index** and query it directly with a key or an **`IDBKeyRange`**:

```js
store.createIndex('by-category', 'category');          // in onupgradeneeded
store.index('by-category').getAll('books');            // O(matches), not O(all)
// compound: createIndex('cat-date', ['category', 'createdAt']) for sorted ranges
```

### 2. Batch writes into ONE transaction
A transaction has commit overhead. Doing 10k adds in **one** `readwrite` transaction is dramatically
faster than 10k separate transactions. The classic mistake is `await`-ing per record (which can also
**auto-close the transaction**).

### 3. Cursors for iteration & pagination — not `getAll()` everything
`getAll()` deserializes the **entire** result set into memory at once. For large stores, walk a
**cursor** (optionally over an index key range) and paginate with `IDBKeyRange` + `continue()` so you
hold only a page in memory.

### 4. Mind the transaction lifecycle
A transaction **auto-commits** when there are no pending requests. **Don't `await` a non-IDB promise
(fetch, timer) between IDB requests** — the transaction commits/closes and the next request throws
`TransactionInactiveError`. Keep all requests in the same synchronous flow.

### 5. The hidden cost: structured clone on the main thread
IDB I/O is async, but **serializing/deserializing** each value (structured clone) happens on the
**main thread**. Huge objects → main-thread jank. Store `Blob`s/`ArrayBuffer`s **natively** (don't
base64 them into strings), keep records lean, and consider doing IDB work in a **Worker**.

### 6. Versioning & migrations
Schema changes go through `onupgradeneeded` with a bumped version: create/delete stores and indexes,
and **migrate data** forward. Plan migrations like a server DB; they run once per version bump.

### 7. Sharding & quotas
Split very large or independent datasets across multiple stores/databases. Watch **storage quota**
(`navigator.storage.estimate()`), request **persistent** storage (`navigator.storage.persist()`) so
the browser won't evict you under pressure.

## Senior checklist

- IndexedDB = transactional async object DB for large structured client data; use a wrapper (`idb`/
  Dexie) but understand the primitives.
- **Index what you query** (+ key ranges / compound indexes); never full-scan-and-filter at scale.
- **Bulk writes in one transaction**; iterate/paginate with **cursors**, not `getAll()` on huge
  stores.
- Don't `await` non-IDB work mid-transaction (auto-commit closes it); structured clone is a
  **main-thread** cost (lean records, native Blobs, maybe a Worker); version with `onupgradeneeded`
  and watch quota/persistence.

## References

- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [`idb` library](https://github.com/jakearchibald/idb) · [Dexie.js](https://dexie.org/)
- [web.dev: Storage for the web & quotas](https://web.dev/articles/storage-for-the-web)
