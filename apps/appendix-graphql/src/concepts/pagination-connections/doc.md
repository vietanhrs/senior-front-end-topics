# Pagination and connections

GraphQL can paginate with simple lists, offsets, or cursor connections. Senior front-end work
usually prefers cursor pagination for feeds and mutable lists.

## Offset vs cursor

Offset:

```graphql
transactions(offset: 40, limit: 20)
```

Simple, but unstable when rows are inserted/deleted while the user scrolls.

Cursor:

```graphql
transactions(first: 20, after: "opaque-cursor")
```

Stable relative to a known edge, assuming the backend cursor encodes the sort/filter position.

## Connection shape

```graphql
type TransactionConnection {
  edges: [TransactionEdge!]!
  pageInfo: PageInfo!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

`edges.cursor` is useful when every row needs its own cursor. `nodes` is convenient when the UI
does not need edge metadata.

## Front-end merge policy

The client cache must know:

- which variables define a distinct list,
- how new pages append/prepend,
- how to avoid duplicate nodes,
- when changing filters resets the list.

## Senior interview phrasing

> I use cursor pagination for mutable lists, keep cursors opaque, include `pageInfo`, and define
> client merge policy keyed by filters and sort. Otherwise infinite scroll becomes duplicate,
> missing, or mixed data.

## References

- [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [GraphQL: Pagination](https://graphql.org/learn/pagination/)
