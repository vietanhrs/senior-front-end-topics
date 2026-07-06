# Security, governance, and evolution

GraphQL gives clients flexibility. Production systems need controls so that flexibility does not
become data leakage, backend overload, or schema breakage.

## Authorization

Authorize at the level where sensitivity exists:

- operation-level auth is not enough when fields differ in sensitivity,
- object-level auth protects entity access,
- field-level auth protects sensitive fields such as email, balances, roles, or internal status.

Do not assume "the parent object was allowed, so every nested field is allowed".

## Query admission

Common controls:

- depth limit,
- complexity limit,
- max list size,
- persisted queries,
- allowlists for high-risk clients,
- rate limiting by user/client/operation,
- timeout and resolver budget.

## Schema evolution

GraphQL evolves by adding fields and deprecating old ones:

```graphql
type User {
  displayName: String!
  fullName: String @deprecated(reason: "Use displayName")
}
```

Avoid changing field meaning in place. Track client usage before removing deprecated fields.

## Observability

Log operation name, variables shape, client name/version, resolver timing, error path, and result
size. Without operation-level observability, debugging GraphQL becomes guesswork.

## Senior interview phrasing

> A GraphQL schema needs governance: field-level authorization, query cost controls, persisted
> queries where appropriate, deprecation-based evolution, and operation tracing. Otherwise a
> flexible client API can become an unsafe public query language over backend systems.

## References

- [GraphQL: Authorization](https://graphql.org/learn/authorization/)
- [GraphQL: Best practices](https://graphql.org/learn/best-practices/)
- [GraphQL over HTTP](https://graphql.github.io/graphql-over-http/draft/)
