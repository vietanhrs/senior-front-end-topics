# Detached DOM nodes

## What they are

A **detached DOM node** is an element that has been **removed from the document tree** but is
**still referenced by JavaScript**, so it (and its entire subtree) can't be garbage-collected. It's
one of the most common front-end **memory leaks** — invisible on screen, growing in the heap.

```
document ──x── (node removed from DOM)
                    ▲
   jsArray ─────────┘   ← a JS reference keeps the node + its subtree alive (detached)
```

Because a detached node retains its **children, attributes, and event listeners**, one retained
root can hold megabytes.

## How they happen

### 1. Holding references after removal
```js
const cache = [];
function showRow(data) {
  const el = renderRow(data);
  list.appendChild(el);
  cache.push(el);     // ❌ keeps the node forever
}
list.innerHTML = '';  // removes from DOM... but `cache` still references every node → detached
```

### 2. Event listeners / closures
A listener whose closure captures a node (or big data) keeps it alive if you never remove the
listener — especially listeners added to **long-lived** targets (`window`, `document`, a store, a
global event bus):
```js
window.addEventListener('resize', () => layout(bigComponentTree)); // never removed → leak
```

### 3. Framework escape hatches
- React: storing DOM nodes from refs in module scope / a global; subscriptions in `useEffect`
  without a cleanup; timers/intervals not cleared; observers (`ResizeObserver`,
  `IntersectionObserver`, `MutationObserver`) never `disconnect()`-ed.
- Caches/`Map`s keyed by or holding DOM nodes that outlive the nodes.

### 4. Closures capturing more than you think
A single closure shared across handlers can keep an entire scope (including detached nodes) alive
because closures retain their whole lexical environment.

## Finding them

- **DevTools → Memory → Heap snapshot**: take a snapshot, filter by **"Detached"** — you'll see
  `Detached HTMLDivElement`, etc. Click one and read the **"Retainers"** path to see *what* is
  holding it.
- **Three-snapshot technique**: snapshot → do the action that should free memory (navigate away,
  close the modal) → snapshot → repeat. If detached nodes accumulate across cycles, you have a leak.
- **`performance.memory`** (Chrome, non-standard) gives a rough `usedJSHeapSize` to watch trend.
- **Performance monitor** (DevTools) shows live "DOM Nodes" count — if it only ever climbs, nodes
  aren't being freed.

## Fixing & preventing

- **Null out references** when you're done (`cache.length = 0`, `ref = null`).
- **Always pair** `addEventListener` with `removeEventListener`; in React, return a cleanup from
  `useEffect`. `disconnect()` observers; `clearInterval/Timeout`; `abort()` controllers.
- Prefer **`WeakMap`/`WeakRef`** when associating data with nodes, so the entry doesn't keep the node
  alive.
- Avoid retaining DOM in module scope or long-lived stores; store **data**, not nodes.
- Use **event delegation** (one listener on a stable ancestor) instead of per-node listeners.

## Senior checklist

- Detached node = removed from DOM but still JS-referenced → can't be GC'd (leak), retains its subtree.
- Top causes: caches holding nodes, un-removed listeners on long-lived targets, un-cleaned effects/observers.
- Diagnose via Heap snapshot → "Detached" + Retainers path; the 3-snapshot technique confirms leaks.
- Fix: null refs, cleanup listeners/observers/timers, use WeakMap/WeakRef, delegate events.

## References

- [Chrome DevTools: Fix memory problems (detached nodes)](https://developer.chrome.com/docs/devtools/memory-problems/)
- [web.dev: Diagnose memory issues](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)
- [MDN: WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [MDN: WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
