# Subscriptions and realtime updates

GraphQL subscriptions deliver server events to clients, often over WebSocket or another persistent
transport.

They are not simply "queries that keep running". They need realtime system design.

## Contract requirements

A good subscription payload includes:

- entity identity for cache writes,
- version/sequence/timestamp for ordering,
- enough fields to update visible UI,
- context for filtering and authorization.

## Reconnect and backfill

Connections drop. Browsers sleep. Mobile networks flap.

The client needs a recovery plan:

- refetch active queries after reconnect,
- resume from last sequence if supported,
- ignore stale events,
- show connection state if realtime freshness matters.

## Cache integration

Subscription events should update the same normalized entities that queries read. If subscription
state lives only in component state, query screens and realtime screens will diverge.

## When not to use subscriptions

Prefer polling or background refetch when:

- updates are low-frequency,
- ordering is not critical,
- infrastructure cannot support many persistent connections,
- the product can tolerate seconds of staleness.

## Senior interview phrasing

> For GraphQL subscriptions I care about ordering, reconnect/backfill, cache writes, and connection
> state. The hard part is not opening a WebSocket; it is keeping query state and realtime events
> consistent under network failure.

## References

- [GraphQL: Subscriptions](https://graphql.org/learn/queries/#subscriptions)
- [GraphQL over WebSocket protocol](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md)
