# Queries, variables, and fragments

GraphQL queries should be shaped around the screen or interaction that owns them. They are not a
place to fetch "everything we might need someday".

## Named operations

Always name operations:

```graphql
query PortfolioPage($id: ID!) {
  portfolio(id: $id) {
    id
    name
  }
}
```

Names appear in logs, traces, persisted query registries, error reporting, and browser devtools.

## Variables

Dynamic values belong in variables, not string-built query documents. Variables help with:

- cache keys,
- persisted queries,
- validation,
- type generation,
- avoiding unsafe string construction.

## Fragments

Fragments are reusable field selections:

```graphql
fragment PositionRow on Position {
  id
  symbol
  quantity
}
```

Good fragments mirror stable UI sub-contracts. Bad fragments become global bags of fields and
silently increase payload size across many screens.

## Colocation

A practical front-end architecture keeps route operations near route code and component fragments
near reusable components. Codegen then creates exact TypeScript types for the operation result and
variables.

## Senior interview phrasing

> I design GraphQL operations as named, typed UI contracts. Variables hold dynamic input, fragments
> represent stable component data needs, and codegen keeps the TypeScript layer honest.

## References

- [GraphQL: Queries and Mutations](https://graphql.org/learn/queries/)
- [GraphQL: Variables](https://graphql.org/learn/queries/#variables)
- [GraphQL: Fragments](https://graphql.org/learn/queries/#fragments)
