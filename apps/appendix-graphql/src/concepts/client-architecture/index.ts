import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const clientArchitecture = makeGraphQLConcept({
  slug: 'client-architecture',
  title: 'Client architecture and generated types',
  summary: 'A strong GraphQL client setup aligns codegen, operation ownership, cache policy, and UI state.',
  tags: ['GraphQL', 'Architecture', 'Codegen'],
  doc,
  problem:
    'GraphQL scales on the front end when generated types, colocated operations, cache policy, and runtime error handling are designed together.',
  code: gql`
fragment PortfolioHeader on Portfolio {
  id
  name
  totalValue { amount currency decimals }
}

query PortfolioHeaderQuery($id: ID!) {
  portfolio(id: $id) {
    ...PortfolioHeader
  }
}
  `,
  decisionRows: [
    {
      decision: 'Code generation',
      good: 'Generate operation result and variable types from the schema.',
      risk: 'Manual types drift from production schema.',
    },
    {
      decision: 'Colocation',
      good: 'Keep operation fragments near the component or route that owns them.',
      risk: 'Global fragments become accidental dependencies.',
    },
    {
      decision: 'Runtime policy',
      good: 'Define fetch, cache, retry, auth, and error policies per operation class.',
      risk: 'Every screen invents different loading and failure behavior.',
    },
  ],
  exercise: {
    prompt: 'Propose a front-end GraphQL architecture for a medium-size app.',
    answer: `I would use schema-driven codegen, named operations, colocated fragments, and a shared GraphQL client with explicit auth/error/retry/cache policies. Route-level queries own page data; component fragments own reusable UI sub-contracts. Mutations return changed entities for cache updates. CI should validate operations against the schema and fail on breaking schema changes before runtime.`,
    checklist: [
      'Mentions codegen.',
      'Mentions colocated operations/fragments.',
      'Mentions cache/error/fetch policy.',
      'Mentions CI schema validation.',
    ],
  },
});
