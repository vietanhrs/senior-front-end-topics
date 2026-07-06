import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const schemaResolvers = makeGraphQLConcept({
  slug: 'schema-resolvers',
  title: 'Schema, types, and resolvers',
  summary: 'The schema is the product contract; resolvers are the server execution plan behind it.',
  tags: ['GraphQL', 'Schema', 'Resolvers'],
  doc,
  problem:
    'GraphQL lets the client ask for fields, but the server schema still decides what exists, how it is typed, and what each field costs to resolve.',
  code: gql`
type Query {
  viewer: User!
  portfolio(id: ID!): Portfolio
}

type Portfolio {
  id: ID!
  name: String!
  positions: [Position!]!
  totalValue: Money!
}

type Money {
  amount: String!
  currency: String!
  decimals: Int!
}
  `,
  decisionRows: [
    {
      decision: 'Type shape',
      good: 'Expose stable domain objects with IDs, nullability, and scalar semantics.',
      risk: 'A vague schema becomes a typed proxy for backend implementation details.',
    },
    {
      decision: 'Resolver ownership',
      good: 'Know which service/database each field hits and batch expensive lookups.',
      risk: 'A cheap-looking nested field can hide many backend calls.',
    },
    {
      decision: 'Nullability',
      good: 'Use non-null only when the field is truly guaranteed.',
      risk: 'One resolver failure can null out a larger response than intended.',
    },
  ],
  exercise: {
    prompt: 'Review a schema for a portfolio page before the front-end starts building against it.',
    answer: `I would review the schema as a client contract:

- Every object rendered in a list needs a stable id for caching.
- Money-like values need amount, currency, and decimals; never a naked float.
- Nullability must match real failure modes.
- Expensive derived fields should be documented or moved behind explicit query fields.
- Resolver owners should confirm batching for nested fields like positions and token metadata.`,
    checklist: [
      'Covers IDs and cache identity.',
      'Covers nullability semantics.',
      'Mentions resolver/backend cost.',
      'Defines domain scalars precisely.',
    ],
  },
});
