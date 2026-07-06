# Mutations and error semantics

GraphQL mutations change server state. For front-end reliability, the important part is not just
syntax; it is the response contract.

## Mutation payload pattern

A mutation should usually return:

- the changed entity or enough fields to update cache,
- typed domain errors,
- metadata needed for idempotency or reconciliation.

```graphql
mutation RenamePortfolio($input: RenamePortfolioInput!) {
  renamePortfolio(input: $input) {
    portfolio { id name updatedAt }
    userErrors { field code message }
  }
}
```

## Three error classes

1. **Transport errors**: network failed, timeout, 5xx, gateway issue. The operation status may be
   unknown.
2. **GraphQL execution errors**: resolver threw, permission failed, non-null bubbling happened.
   Data may be partial.
3. **Domain errors**: validation/business rejection represented in the payload, often as
   `userErrors`.

Treating all three as "show toast" creates poor UX.

## Optimistic UI

Optimistic mutation is safe only when:

- the action is low-risk or reversible,
- the client can generate a temporary cache state,
- rollback is explicit,
- the server response reconciles the final entity state.

## Senior interview phrasing

> For mutations, I want typed input, idempotency for repeatable actions, domain errors in the
> payload, and changed entity fields in the response so the client cache can update deterministically.

## References

- [GraphQL: Mutations](https://graphql.org/learn/queries/#mutations)
- [GraphQL over HTTP: Response](https://graphql.github.io/graphql-over-http/draft/#sec-Response)
