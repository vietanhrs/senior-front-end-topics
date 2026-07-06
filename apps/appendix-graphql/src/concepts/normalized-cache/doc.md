# Normalized client cache

GraphQL clients such as Apollo and Relay can normalize response objects into an entity map.

The typical cache key is:

```text
__typename + id
```

For example:

```json
{
  "Token:ada": {
    "__typename": "Token",
    "id": "ada",
    "symbol": "ADA"
  }
}
```

## Why it matters

If two screens query the same token, they should read the same cached entity. When a subscription
or mutation updates that token, both screens can update consistently.

Without normalization, every query result is a disconnected copy.

## Requirements

- Objects need stable IDs.
- Responses need `__typename` when the client requires it.
- Pagination fields need merge policies.
- Mutations should return changed entities.
- Local-only UI state should not be confused with server entity state.

## When not to normalize

Some data is naturally query-scoped:

- search result ranking,
- aggregate analytics,
- permissions for a specific viewer/context,
- fields dependent on arguments.

Normalize entities, but keep connection/order/query-specific data under the query field policy.

## Senior interview phrasing

> A GraphQL cache is not magic. It needs stable object identity, field policies for lists, and
> mutation/subscription payloads that include the changed entities. Otherwise GraphQL just moves
> stale state bugs into the client cache.

## References

- [Apollo Client: Normalized cache](https://www.apollographql.com/docs/react/caching/overview)
- [Relay: Data masking and store](https://relay.dev/docs/principles-and-architecture/runtime-architecture/)
