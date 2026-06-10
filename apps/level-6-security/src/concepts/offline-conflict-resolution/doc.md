# Offline conflict resolution

> The capstone of offline/PWA work (and where Service Workers, IndexedDB, and background sync lead).
> Once clients can edit **while disconnected**, two replicas can change the *same* data
> independently — and on reconnect you must **merge divergent histories** without losing work.

## Why conflicts are unavoidable offline

Offline-first means each device holds a **local replica** and queues mutations while disconnected.
Two users (or two tabs/devices of one user) edit the same record offline; both sync later. There is
no single authoritative ordering at edit time, so the server (or peer) sees **concurrent** writes
to the same state. The question isn't *if* they conflict, but *how you resolve it* — and that's a
**product decision**, not just a technical one.

## The resolution strategies

### 1. Last-Write-Wins (LWW)
Attach a timestamp/version to each write; the latest wins, the other is discarded.

- ✅ Trivial to implement; fine for "current value" fields (a status, a toggle, a title).
- ❌ **Silently loses data** — the overwritten edit is gone. Clock skew makes "latest" wrong.
  Per-**field** LWW (timestamp each field) is much better than per-**document** LWW (one late edit
  to one field clobbers the whole record).

### 2. Merge / operation-based (CRDT-style)
Don't sync **state**, sync **operations**, and design data types whose ops **commute** (order
doesn't matter) so any replicas converge to the same result automatically:

- **Counter**: sync `+1`/`-1` deltas, not the total → both increments survive (sum).
- **Set / tags (OR-Set)**: track adds/removes with unique tags → merge = union (with remove-wins
  or add-wins rules). Both users' additions survive.
- **Text**: sequence CRDTs (RGA/Yjs/Automerge) or OT merge concurrent edits character-wise.

These are **CRDTs** (Conflict-free Replicated Data Types): mathematically guaranteed to converge,
no central coordinator. Libraries: **Yjs**, **Automerge**. The cost is metadata/complexity and
sometimes surprising-but-deterministic merges.

### 3. Manual / interactive resolution
Detect the conflict (via **version vectors**: each replica tracks a per-replica counter; two
versions conflict if neither dominates the other) and **ask the user** to pick or merge — the
"this file changed on the server" / 3-way-merge prompt.

- ✅ No silent loss; right for high-stakes, hard-to-auto-merge content.
- ❌ Friction; needs good diff UI; bad if conflicts are frequent.

### Detecting concurrency: version vectors vs timestamps
A wall-clock timestamp can't tell *concurrent* from *sequential* edits (and clocks drift). **Version
vectors / Lamport clocks** capture causality: version `A` *dominates* `B` (so no conflict) only if
it's causally after it; otherwise they're concurrent → real conflict. This is what lets you choose
"auto-merge" vs "ask the user" correctly.

## Choosing per field, not per app

Real apps **mix** strategies by field: LWW for a title, OR-Set union for tags/labels, an op-based
counter for likes, a text-CRDT for the body, manual for anything truly ambiguous. Don't pick one
global policy — model each field's merge semantics.

## Practical plumbing

- Queue mutations locally (IndexedDB) with a client-generated **id** and a base **version**; replay
  on reconnect (Background Sync). Make server writes **idempotent** (Level 4) so retries don't dup.
- Send **operations + base version**, let the server detect concurrency (vector/`If-Match` ETag) and
  either fast-forward, auto-merge, or return a conflict for the client to resolve.
- Show sync state honestly (pending/synced/conflict); never silently drop a user's offline work.

## Senior checklist

- Offline replicas diverge; resolution strategy is a product choice: LWW, op-based/CRDT merge, or manual.
- LWW loses data and trusts clocks — prefer **per-field** LWW; use CRDTs (counter=sum, set=union, text=Yjs) to preserve concurrent edits.
- Detect *concurrency* with version vectors/Lamport clocks, not wall-clock alone; mix strategies per field.
- Queue idempotent mutations (IndexedDB + background sync); surface conflict state; reconcile with ETag/version on the server.

## References

- [web.dev: Offline cookbook & background sync](https://web.dev/articles/offline-cookbook)
- [Automerge — CRDTs for apps](https://automerge.org/)
- [Yjs — shared editing CRDT](https://docs.yjs.dev/)
- [Ink & Switch: Local-first software](https://www.inkandswitch.com/local-first/)
