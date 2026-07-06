# Client architecture and generated types

A mature GraphQL front end is not just `fetch('/graphql')`. It is a pipeline:

```text
schema -> operation documents -> validation/codegen -> runtime client -> cache/error policy -> UI
```

## Code generation

Generate TypeScript types from real operation documents:

- result type,
- variables type,
- enum/scalar mapping,
- fragment types.

Schema-wide types are less useful than operation-specific types because GraphQL responses are
selected per operation.

## Operation ownership

Recommended ownership:

- route query owns page-level data,
- reusable component owns fragment-level data,
- mutation is colocated with the interaction that triggers it,
- shared fragments are rare and intentional.

## Runtime policies

Define policy instead of repeating ad hoc behavior:

- auth header injection,
- retry rules,
- fetch policy,
- cache merge policy,
- GraphQL vs network error handling,
- persisted query behavior,
- upload/realtime transport if needed.

## CI gates

CI should validate operations against the schema. Breaking schema changes should fail before a
deployed client discovers them at runtime.

## Senior interview phrasing

> My GraphQL front-end architecture starts from generated operation types and named operations.
> I colocate fragments with UI ownership, centralize runtime policies, and validate operations in
> CI so schema changes cannot silently break deployed screens.

## References

- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [Relay](https://relay.dev/docs/)
