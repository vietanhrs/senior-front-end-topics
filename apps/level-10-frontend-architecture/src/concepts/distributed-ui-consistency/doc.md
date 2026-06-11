# Distributed UI consistency

## Your UI state is already distributed

Even a "simple" web app holds the same state in many places at once: the server (source of record), a
client cache, React state, **multiple open tabs**, other devices, and a Service Worker cache. Each is
a **replica**. The moment one changes, the others are momentarily **inconsistent**. Distributed-UI
consistency is about choosing *how consistent* they need to be, and engineering that — it's the CAP/
PACELC trade-off applied to the front-end.

## The consistency models (borrowed from distributed systems)

- **Strong consistency** — every replica reflects the latest write immediately. Requires coordination
  (a round-trip / lock) → higher latency, lower availability. Use sparingly (e.g. "is this username
  taken").
- **Eventual consistency** — replicas converge *eventually* if updates stop. The default for offline/
  optimistic/multi-tab UIs. Cheap and available, but you can briefly read stale data.
- **Causal consistency** — causally-related updates are seen in order (you see the reply only after
  the message). Stronger than eventual, weaker than strong.
- **Read-your-writes** — you always see your *own* writes (even before the server confirms) — what
  optimistic UI gives you.
- **Monotonic reads** — once you've seen a value, you never see an *older* one. Critical for dropping
  **stale/out-of-order** updates (version the data and ignore lower versions).

The front-end almost always lives in **eventual + read-your-writes + monotonic reads**: optimistic
local updates, converge in the background, never go backwards.

## Front-end mechanisms

- **Multi-tab sync**: **`BroadcastChannel`** (post messages to all same-origin tabs), the
  **`storage`** event (fires in *other* tabs on `localStorage` writes), **`SharedWorker`** (one shared
  context), and **`Web Locks`** for **leader election** (elect one tab to own the socket / do the
  sync, others follow).
- **Single source of truth + broadcast**: one writer updates the canonical store, then broadcasts;
  replicas apply. Avoid N tabs all writing the server independently.
- **Versioning for monotonicity**: tag every update with a version/Lamport timestamp; a replica
  **drops** any incoming update whose version isn't newer than what it has → no going backwards, no
  out-of-order flicker.
- **Optimistic + reconcile**: apply locally now (read-your-writes), then reconcile with the
  authoritative response; if they differ, the server wins (or you run a conflict model — previous
  concept).

## The trade-off to state out loud

You can't have strong consistency, full availability, **and** low latency at once. Pick per feature:
a collaborative cursor wants **low latency + eventual** (CRDT); a bank transfer wants **strong**; a
"liked" toggle wants **read-your-writes + eventual**. Naming the model you're targeting is the senior
skill — most "weird flicker / stale data / tabs disagree" bugs are an *unstated, wrong* consistency
choice.

## Senior checklist

- Treat tabs/devices/cache/server as **replicas**; pick a consistency model per feature
  (strong/eventual/causal/read-your-writes/monotonic).
- Front-end default: **eventual + read-your-writes + monotonic reads** — optimistic now, converge
  later, never show older data.
- Sync tabs with **BroadcastChannel** / `storage` events / SharedWorker; elect a leader with **Web
  Locks**; broadcast from a single source of truth.
- **Version every update** and drop non-newer ones (monotonicity); reconcile optimistic state with
  the authority and resolve real conflicts explicitly.

## References

- [MDN: BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [MDN: Web Locks API (leader election)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [MDN: storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
- [Consistency models (overview)](https://jepsen.io/consistency)
