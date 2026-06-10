# Event sourcing in the frontend

## The core idea

Instead of storing **current state** and overwriting it, **event sourcing** stores the
**append-only log of events** that happened, and derives state by **folding** (reducing) over that
log:

```
state = events.reduce(apply, initialState)
```

The events are the source of truth; the state is a **projection** (a cached fold). This flips the
usual model: you never mutate "the truth", you only **append** facts ("ItemAdded", "ItemToggled",
"CheckedOut").

```
[ ItemAdded("Milk") , ItemAdded("Eggs") , ItemToggled(0) , ItemRemoved(1) ]
        │ fold (apply each event in order)
        ▼
current state: [ { text: "Milk", done: true } ]
```

## Why it's powerful in UI

- **Undo/redo for free**: undo = move a cursor back / drop the last event; redo = re-apply. No
  bespoke inverse operations — you replay the log to a point in time.
- **Time-travel debugging**: render the state at event *N* by folding the first *N* events. This is
  exactly how the Redux DevTools time-travel works (Redux is event-sourcing-flavored: actions are
  events, the reducer is `apply`).
- **Audit & analytics**: the log *is* the history — who did what, when. Great for collaborative
  apps, financial UIs, forms with full edit history.
- **Derived views (projections)**: build many read models from one log (a list view, a count, a
  summary) — each is just a different fold.
- **Sync & offline**: events are small, ordered, and mergeable; they underpin CRDTs/OT for
  collaborative editing and offline-first sync (you ship events, not whole documents).

## Commands vs events

- A **command** is an *intent* that may be rejected ("ToggleItem"): validated, may fail.
- An **event** is a *fact* that already happened ("ItemToggled"): never fails, never changes.
  You validate when producing the event; once in the log, it's immutable.

## Snapshots (the performance caveat)

Folding the entire log on every render is O(n). For long logs, **snapshot** periodically: store
`state@event_k` and fold only events after `k`. (Redux keeps the latest state and applies one
action at a time — an incremental fold, the common optimization.)

## Trade-offs / when not to

- **More moving parts**: you design an event schema and an `apply` function; over-engineering a
  simple form is a real risk.
- **Schema evolution**: old events must remain replayable as your `apply` changes — version events
  or write upcasters. (You can't "edit history".)
- **Projection rebuild cost**: large logs need snapshots; naive replay can be slow.
- Use it where **history, undo/redo, audit, or collaboration** matter — not for every bit of local
  UI state.

## Senior checklist

- State = fold over an append-only event log; events are immutable facts, commands are intents.
- Undo/redo & time-travel fall out naturally (replay to a cursor); Redux is this pattern.
- Snapshot to avoid O(n) replays on long logs; version events for schema evolution.
- Reach for it when you need history/audit/collab/offline; don't over-apply it.

## References

- [Redux: motivation & time-travel](https://redux.js.org/understanding/thinking-in-redux/motivation)
- [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CRDTs & local-first (Ink & Switch)](https://www.inkandswitch.com/local-first/)
- [Redux DevTools (time-travel)](https://github.com/reduxjs/redux-devtools)
