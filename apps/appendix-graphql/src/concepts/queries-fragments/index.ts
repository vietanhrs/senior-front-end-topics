import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const queriesFragments = makeGraphQLConcept({
  slug: 'queries-fragments',
  title: 'Queries, variables, and fragments',
  summary: 'Operations should be screen-shaped, typed, reusable, and explicit about variables.',
  tags: ['GraphQL', 'Queries', 'Fragments'],
  doc,
  problem:
    'GraphQL avoids over-fetching only when operations are designed around real UI needs and shared fragments are kept intentional.',
  code: gql`
query PortfolioPage($id: ID!, $first: Int!, $after: String) {
  portfolio(id: $id) {
    id
    name
    positions(first: $first, after: $after) {
      nodes {
        id
        ...PositionRow
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}

fragment PositionRow on Position {
  symbol
  quantity
  value { amount currency decimals }
}
  `,
  decisionRows: [
    {
      decision: 'Operation ownership',
      good: 'Name operations by product screen or interaction.',
      risk: 'Anonymous or generic operations are hard to trace in logs and persisted query registries.',
    },
    {
      decision: 'Fragment scope',
      good: 'Use fragments for stable UI sub-contracts, not dumping every possible field.',
      risk: 'Shared fragments can silently over-fetch across many screens.',
    },
    {
      decision: 'Variables',
      good: 'Put dynamic values in variables for caching, persisted queries, and safety.',
      risk: 'String-built queries break caching and invite injection-like mistakes.',
    },
  ],
  exercise: {
    prompt: 'A component imports a giant UserFragment used by five pages. What should you check?',
    answer: `I would split fragments by UI responsibility.

The profile header, account menu, and permission guard probably need different fields. A shared fragment is fine only when the fields change together as one contract. I would inspect payload size, generated types, cache normalization, and whether removing a field from one screen risks breaking another screen.`,
    checklist: [
      'Names operation and fragment ownership.',
      'Mentions payload bloat.',
      'Mentions generated types.',
      'Mentions cache impact.',
    ],
  },
});
