import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const nPlusOnePerformance = makeGraphQLConcept({
  slug: 'n-plus-one-performance',
  title: 'N+1, batching, and query cost',
  summary: 'Nested field selection can hide backend fan-out unless resolvers batch and limit cost.',
  tags: ['GraphQL', 'Performance', 'Backend cost'],
  doc,
  problem:
    'GraphQL makes nested data easy to request, but each nested field can map to database or service calls unless resolvers are batched.',
  code: gql`
query Dashboard {
  portfolios {
    id
    positions {
      id
      token {
        id
        symbol
        price { amount currency decimals }
      }
    }
  }
}
  `,
  decisionRows: [
    {
      decision: 'Batching',
      good: 'Resolvers batch token and price lookups by ID using DataLoader-like patterns.',
      risk: 'One dashboard query creates hundreds of backend calls.',
    },
    {
      decision: 'Cost limits',
      good: 'Depth, complexity, and list limits protect the graph.',
      risk: 'A valid query can become a denial-of-service vector.',
    },
    {
      decision: 'Tracing',
      good: 'Operation traces show resolver timing and fan-out.',
      risk: 'The front-end sees slow GraphQL but cannot locate the expensive field.',
    },
  ],
  exercise: {
    prompt: 'A GraphQL dashboard query is slow only for users with many portfolios. What is the likely review path?',
    answer: `Check the query shape for nested lists, then inspect resolver tracing. The suspicious pattern is portfolios -> positions -> token -> price where each level fans out. The fix is not simply \"ask for fewer fields\"; the server should batch lookups, enforce list limits, cache expensive reference data, and expose pagination where cardinality is unbounded.`,
    checklist: [
      'Identifies nested fan-out.',
      'Mentions DataLoader/batching.',
      'Mentions depth/complexity/list limits.',
      'Mentions tracing/observability.',
    ],
  },
});
