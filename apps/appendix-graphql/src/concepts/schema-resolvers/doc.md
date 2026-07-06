# Schema, types, and resolvers

GraphQL starts with a schema. The schema is not just documentation; it is the typed contract that
client operations are validated against and server resolvers execute.

## Core idea

- **Schema**: the graph of types, fields, arguments, enums, interfaces, unions, and custom scalars.
- **Operation**: a query/mutation/subscription sent by a client.
- **Resolver**: server function that produces a field value.
- **Execution**: GraphQL walks the operation tree and calls resolvers as needed.

## What front-end engineers must care about

The front end consumes the schema as a product API. A strong schema makes UI work predictable:

- object IDs enable normalized caching,
- nullability defines failure behavior,
- custom scalars define formatting and precision,
- field names describe domain language,
- resolver cost determines page latency.

## Nullability

`String!` means GraphQL promises the value is never null. If a non-null field resolver returns null
or throws, GraphQL bubbles that null up to the nearest nullable parent.

Use non-null for true invariants, not optimism. A wrong `!` can turn a small partial failure into a
missing section or page.

## Money and precision

Avoid naked floats for money/token amounts:

```graphql
type Money {
  amount: String!
  currency: String!
  decimals: Int!
}
```

This protects precision and gives the UI enough information for formatting.

## Senior interview phrasing

> GraphQL is schema-first. The schema gives the client a typed contract, but every field still has
> resolver cost and authorization semantics. I review IDs, nullability, custom scalars, resolver
> ownership, and evolution before treating the schema as front-end-safe.

## References

- [GraphQL: Schemas and Types](https://graphql.org/learn/schema/)
- [GraphQL: Execution](https://graphql.org/learn/execution/)
- [GraphQL: Validation](https://graphql.org/learn/validation/)
