# N+1, batching, and query cost

GraphQL lets clients ask for nested data. That is ergonomic, but the server may need to resolve
each nested field separately.

## N+1 example

A dashboard asks for portfolios, positions, token metadata, and prices. Naive resolvers may do:

```text
1 query for portfolios
N queries for positions
N*M queries for tokens
N*M queries for prices
```

The GraphQL document looks clean. The backend fan-out is not.

## DataLoader pattern

Resolvers should batch by key during one operation:

```text
tokenLoader.loadMany(tokenIds)
priceLoader.loadMany(symbols)
```

The exact implementation differs by stack, but the principle is batching, caching within a request,
and avoiding per-row service calls.

## Query admission controls

Production GraphQL should control cost:

- max depth,
- max complexity,
- list size limits,
- persisted query allowlists for sensitive surfaces,
- timeout/budget per operation,
- tracing per field/resolver.

## Front-end responsibility

Front-end engineers should not blindly add nested fields to a critical path. Ask:

- Is this field resolver cheap?
- Is this list bounded?
- Can the operation be split/deferred?
- Does the backend trace show fan-out?

## Senior interview phrasing

> GraphQL performance problems often hide in nested field resolution. I look for N+1 patterns,
> batching, list limits, depth/complexity controls, and operation traces before assuming a slow
> page is a front-end rendering issue.

## References

- [GraphQL: Execution](https://graphql.org/learn/execution/)
- [DataLoader](https://github.com/graphql/dataloader)
