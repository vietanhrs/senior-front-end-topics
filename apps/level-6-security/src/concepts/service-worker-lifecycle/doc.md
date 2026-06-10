# Service Worker lifecycle traps

> Level 1 introduced Service Workers as a network proxy. Here we focus on the **lifecycle** — the
> source of the most confusing production bugs: "I deployed but users still run the old code",
> stale caches, and update loops.

## The lifecycle

```
register → download → INSTALL ──(install event)──▶ INSTALLED / "waiting"
                                                        │  (a previous SW still controls open tabs)
                                                        ▼  (old SW released, or skipWaiting)
                                                    ACTIVATE ──(activate event)──▶ ACTIVATED / controlling
```

- **install**: precache assets. The new SW is *installed* but **does not control any page yet**.
- **waiting**: if an **older SW is still controlling** an open tab, the new one sits in `waiting`
  — indefinitely. **A normal reload does NOT activate it** (the reloaded page is still claimed by
  the old worker). This is the #1 trap.
- **activate**: runs only once the old SW is gone (all its clients closed) — or you force it. Clean
  up old caches here.
- **controlling**: a page is only controlled by a SW that was active **when the page loaded**. A
  freshly registered SW does **not** control the current page until next navigation/claim.

## The traps

### 1. "Stuck in waiting" — users keep the old app
Because reload keeps the old SW alive, the new version can wait forever. Options:

- **`self.skipWaiting()`** (in `install`) → the new SW activates immediately, skipping `waiting`.
- **`clients.claim()`** (in `activate`) → the active SW takes control of *already-open* pages
  (which a fresh SW otherwise wouldn't control until the next navigation).

```js
self.addEventListener('install', (e) => { self.skipWaiting(); /* + precache */ });
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); /* + clean caches */ });
```

### 2. `skipWaiting` can break the *currently open* page
If the old page already fetched `app.[oldhash].js` and the new SW now serves `app.[newhash].js` /
a new API shape, you get **version skew within one session** (lazy chunks 404, mismatched
assets). Safer pattern for app shells: **don't auto-skip**; detect the waiting worker, show a
"**New version available — Reload**" prompt, and call `skipWaiting()` via `postMessage` only when
the user accepts, then reload on `controllerchange`.

```js
// page
reg.addEventListener('updatefound', () => { /* reg.installing → show "update ready" when 'installed' */ });
navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
acceptBtn.onclick = () => reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
// sw: self.addEventListener('message', e => e.data?.type === 'SKIP_WAITING' && self.skipWaiting());
```

### 3. Stale caches / cache versioning
The SW *script* updates, but your **Cache Storage** entries don't clean themselves. Version your
cache names and delete old ones in `activate`, or you ship new code that still serves old assets:

```js
const CACHE = 'app-v2';
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
));
```

### 4. Caching the SW script or the HTML too long
If `sw.js` (or the navigation HTML that registers it) is served with a long `Cache-Control`, the
browser won't even notice a new SW. Serve **`sw.js` with `no-cache`** (browsers also cap SW script
freshness at 24h and bypass HTTP cache for the update check by default, but don't fight it).

### 5. Byte-identical = no update
The browser updates the SW only if `sw.js` **differs by ≥1 byte** from the installed copy. Build
hashes/version stamps in the SW ensure changes are detected.

### 6. Scope & the "first load isn't controlled" gotcha
A SW only controls pages **within its scope**, and the page that registered it isn't controlled on
that first load (until `clients.claim()` or a reload). Don't assume offline works on the very first
visit.

## Senior checklist

- A new SW sits in **waiting** while the old one controls tabs; **reload alone won't activate it**.
- `skipWaiting()` + `clients.claim()` force-update — but can cause version skew; prefer a user "Reload" prompt + `controllerchange`.
- Version cache names and delete old ones in `activate`; serve `sw.js` with `no-cache`.
- Updates need a byte-different `sw.js`; the registering page isn't controlled on first load.

## References

- [web.dev: The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [MDN: Using Service Workers — updates](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Workbox: handling SW updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates/)
- [MDN: Clients.claim() / skipWaiting()](https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim)
