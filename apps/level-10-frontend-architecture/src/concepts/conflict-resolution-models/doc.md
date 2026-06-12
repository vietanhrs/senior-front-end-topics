# Conflict resolution models

## When you need this

Any time the same data can be edited in **more than one place before syncing** — offline edits across
devices, multiplayer collaboration, optimistic UI reconciling with the server — two versions can
diverge from a common ancestor. You must decide **how to reconcile** them. Two separate questions:

1. **Detection** — *is* there a conflict (concurrent edits) or is one just behind the other?
2. **Resolution** — *given* a conflict, what's the merged result?

Conflating these is the classic mistake. You detect with causality metadata, then choose a resolution
policy per field/type.

## Detecting concurrency: version vectors

A timestamp alone can't tell "B is newer" from "B and A happened concurrently." A **version vector**
(vector clock) — a per-replica counter map — captures causality:

- If A's vector **dominates** B's → A strictly happened after B → **fast-forward**, no conflict.
- If neither dominates → the edits are **concurrent** → a real conflict to resolve.

## Resolution models (and what each costs)

- **Last-Write-Wins (LWW)** — newest timestamp/version wins; the rest is **discarded**. Trivial,
  convergent, and **lossy** — the loser's concurrent edits vanish. Fine for low-stakes single-value
  fields (a "last seen" flag), dangerous for documents.
- **Field-level LWW** — LWW per field instead of per record, so unrelated field edits don't clobber
  each other. Better, still lossy *within* a field.
- **Three-way merge** — like git: compare **base → A** and **base → B**; auto-merge non-overlapping
  changes, **flag overlapping** ones as conflicts. Loses nothing silently, but needs a base and a
  conflict story.
- **Manual / user-mediated** — surface both versions and let the user choose/merge ("keep mine /
  theirs / both"). Safest for high-stakes data; costs UX friction.
- **CRDTs** — pick data types whose merge is automatic and convergent (OR-Set union, PN-counter sum,
  MV-register keeps both) — no user prompt, at the cost of metadata/tombstones (level 8).
- **Operational Transformation (OT)** — transform each op against concurrent ops; powerful for text,
  but typically needs a **central server** to order operations (Google Docs' classic engine).
- **Domain-specific merge** — encode intent: sets union, counters sum/max, append-only logs
  concatenate, "status" uses a priority lattice. Usually the best *correctness* per field.

## Choosing

- **Low-stakes single value** → LWW (per field).
- **Structured doc, want auto-merge, P2P/local-first** → CRDTs / domain merges.
- **High-stakes, ambiguous intent** (prices, medical, legal) → detect with version vectors, **resolve
  manually**.
- **Real-time shared text with a server** → OT or a sequence CRDT.

The senior move is **per-field policy**: union the tags, sum the counter, LWW the cosmetic flag, and
prompt the human only for the genuinely conflicting prose.

## Senior checklist

- Separate **detection** (version vectors tell concurrent vs causal) from **resolution** (the policy).
- LWW is simple/convergent but **silently lossy**; prefer **field-level** policies; three-way merge
  flags real conflicts; manual is safest for high-stakes; CRDTs auto-converge with metadata cost; OT
  needs server ordering.
- Choose **per field/type** by intent (union sets, sum counters, LWW flags, prompt for prose).
- Always make conflicts **visible** rather than dropping a user's work without telling them.

## References

- [Wikipedia: Version vector](https://en.wikipedia.org/wiki/Version_vector)
- [Three-way merge](https://en.wikipedia.org/wiki/Merge_(version_control)#Three-way_merge)
- [Local-first software (conflict handling)](https://www.inkandswitch.com/local-first/)
- [Operational Transformation vs CRDT](https://crdt.tech/)
