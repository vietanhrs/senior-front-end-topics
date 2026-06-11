# MutationObserver cost

## What it observes

`MutationObserver` (MO) reports **changes to the DOM tree** — nodes added/removed, attributes
changed, character data edited — asynchronously and batched, after the current task and its
microtasks settle. It replaced the synchronous, deprecated **Mutation Events** (`DOMNodeInserted`,
`DOMSubtreeModified`, …), which fired on *every* mutation during the operation and were catastrophic
for performance.

```js
const mo = new MutationObserver((mutations, observer) => {
  for (const m of mutations) {
    // m.type: 'childList' | 'attributes' | 'characterData'
    // m.addedNodes / m.removedNodes / m.attributeName / m.oldValue ...
  }
});
mo.observe(targetNode, {
  childList: true,      // direct children added/removed
  subtree: true,        // ...anywhere in the subtree (expensive — see below)
  attributes: true,
  attributeFilter: ['class', 'data-state'], // only these → far cheaper
  attributeOldValue: true,
  characterData: true,
});
```

## Where the cost actually is

MO callbacks are async and batched, so the observer itself is cheaper than old Mutation Events.
But cost is **not zero**, and it scales with what you ask for:

### `subtree: true` is the expensive flag
Observing `childList + subtree` on a large container means **every** descendant mutation — including
ones deep in unrelated parts — gets recorded and delivered. On a busy app (virtualized lists, rich
editors, third-party widgets), that's a flood of `MutationRecord`s. Scope the observed node as
**tightly** as possible; don't observe `document.body` with `subtree: true` unless you truly must.

### Records pile up; the callback runs once
Mutations are queued as a **record list** and delivered in **one microtask-timed callback** with the
whole batch. If you do 10,000 DOM ops, you get one callback with ~10,000 records — your loop over
them is the real work. Two consequences:
- **Don't do heavy work per record.** Coalesce: compute a single "what changed" summary, then act
  once (ideally in a `requestAnimationFrame` if you'll touch layout).
- A record holds **references** to nodes (`addedNodes`, etc.). Holding the records array alive keeps
  those nodes from being GC'd — process and drop them.

### `attributeFilter` and `characterDataOldValue` cut volume
If you only care about `class`/`data-*`, pass `attributeFilter` so other attribute writes don't
generate records at all. Requesting `attributeOldValue` / `characterDataOldValue` makes the browser
snapshot old values — only ask when you use them.

### The classic infinite-loop trap
If your MO callback **mutates the DOM it observes**, those mutations queue *new* records, which
re-invoke the callback → unbounded churn (and possible recursion). Either temporarily
`disconnect()` around your own writes (then `takeRecords()` to drain self-generated records and
re-`observe()`), or guard with a flag so you ignore self-inflicted mutations.

```js
function update() {
  mo.disconnect();          // stop observing our own write
  node.setAttribute('data-x', '1');
  mo.takeRecords();         // discard the records we just caused
  mo.observe(node, opts);   // resume
}
```

## `takeRecords()`

`mo.takeRecords()` synchronously returns and **clears** the pending record queue without waiting for
the callback. Use it to drain just-before-disconnect (so you don't lose changes) or to discard
self-generated mutations as above.

## When *not* to use it

- For "react to my own component's state" → just use your framework; MO is for DOM you **don't
  control** (third-party scripts, contenteditable, server-injected markup, extensions).
- For visibility/size → `IntersectionObserver` / `ResizeObserver`, not MO.
- For attribute-driven styling → CSS attribute selectors, not a JS observer.

## Senior checklist

- MO is async + batched (microtask-timed), replacing the synchronous, deprecated Mutation Events.
- Cost scales with scope: `subtree: true` on a big node floods records — observe the **tightest**
  node; use `attributeFilter`; only request old values you read.
- One callback delivers the whole batch — coalesce, don't do heavy per-record work; drop records so
  their node refs can be GC'd.
- Mutating observed DOM in the callback loops — `disconnect()`/`takeRecords()`/re-`observe()` or guard
  with a flag. Always `disconnect()` on cleanup.

## References

- [MDN: MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [MDN: MutationObserver.observe() options](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe)
- [MDN: MutationRecord](https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord)
- [DOM spec: Mutation observers](https://dom.spec.whatwg.org/#mutation-observers)
