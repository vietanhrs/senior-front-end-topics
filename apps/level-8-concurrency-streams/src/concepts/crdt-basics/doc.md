# CRDT basics for collaboration

> Level 6 contrasted LWW vs CRDT merge for offline conflicts. Here we go into what actually makes a
> **CRDT** tick and why it's the backbone of real-time collaboration (Google Docs-style editing,
> Figma, local-first apps).

## The core idea

A **CRDT** (Conflict-free Replicated Data Type) is a data structure whose replicas can be updated
**independently and concurrently**, with **no coordination**, and still **merge deterministically**
to the same value. The guarantee is **Strong Eventual Consistency (SEC)**: any two replicas that
have seen the same set of updates are in the same state — regardless of the **order** they arrived
or how many times they were delivered.

That guarantee comes from a mathematical shape. The merge operation must be:

- **Commutative** — `merge(a, b) = merge(b, a)` (order doesn't matter),
- **Associative** — `merge(merge(a, b), c) = merge(a, merge(b, c))` (grouping doesn't matter),
- **Idempotent** — `merge(a, a) = a` (re-delivering an update is harmless).

A structure with those properties forms a **join-semilattice**, and merge is the **least upper
bound**. Because of that, you never need locks or a central server to resolve conflicts — the math
resolves them.

## Two flavors

- **State-based (CvRDT):** replicas exchange their **whole state**; the receiver merges via the LUB
  join. Robust over lossy/duplicating channels (idempotent + commutative), but states can be large.
- **Op-based (CmRDT):** replicas broadcast **operations**; if ops are delivered (causal order where
  required) they're applied commutatively. Smaller messages, but needs reliable delivery.

## A worked example: G-Counter

A grow-only counter that increments correctly even when three replicas increment offline:

```js
// Each replica keeps a per-replica count vector; it only increments ITS OWN slot.
inc(state, id)        => ({ ...state, [id]: (state[id] ?? 0) + 1 });
value(state)          => Object.values(state).reduce((a, b) => a + b, 0);
merge(a, b)           => mapKeys(k => Math.max(a[k] ?? 0, b[k] ?? 0)); // element-wise max = LUB
```

`Math.max` per slot is commutative, associative, and idempotent → the counter converges to the true
total no matter the merge order. A **naive single integer** with last-write-wins would *lose*
concurrent increments (only the winning write survives). The per-replica vector is what makes it
conflict-free.

## The CRDT zoo

- **Counters:** G-Counter (grow-only), PN-Counter (inc/dec via two G-Counters).
- **Sets:** G-Set (add-only), **OR-Set** (observed-remove — add-wins with unique tags so concurrent
  add/remove resolves predictably), 2P-Set.
- **Registers:** LWW-Register (timestamp wins), MV-Register (keeps concurrent values).
- **Sequences / text (the collaboration workhorse):** RGA, Logoot/LSEQ, and **YATA** (used by
  **Yjs**) and Automerge's columnar format — assign each character a unique, totally-ordered,
  densely-insertable identity so concurrent inserts interleave deterministically.

## CRDT vs OT

**Operational Transformation** (the older Google Docs approach) transforms each op against
concurrent ops and usually needs a central server to order them. **CRDTs** push the conflict
resolution into the data type itself → peer-to-peer friendly, server-optional, simpler reasoning —
at the cost of metadata overhead (tombstones, unique ids). Modern local-first stacks (Yjs,
Automerge) are CRDT-based.

## Senior checklist

- CRDT = independent concurrent updates + coordination-free deterministic merge → **strong eventual
  consistency**.
- The merge must be **commutative, associative, idempotent** (a semilattice LUB); that's why order
  and duplicate delivery don't matter.
- State-based ships whole state (robust, larger); op-based ships ops (compact, needs delivery
  guarantees).
- Per-replica structure (e.g. G-Counter's vector, OR-Set's tags) is what avoids the lost-update
  problem LWW has; sequence CRDTs (Yjs/Automerge) power collaborative text.

## References

- [Shapiro et al.: A comprehensive study of CRDTs (paper)](https://hal.inria.fr/inria-00555588/document)
- [crdt.tech — CRDT overview & zoo](https://crdt.tech/)
- [Yjs (YATA) docs](https://docs.yjs.dev/)
- [Automerge](https://automerge.org/)
