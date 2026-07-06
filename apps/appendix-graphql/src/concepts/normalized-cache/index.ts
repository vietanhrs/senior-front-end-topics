import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const normalizedCache = makeGraphQLConcept({
  slug: 'normalized-cache',
  title: 'Normalized client cache',
  summary: 'GraphQL clients can normalize entities by typename and ID to keep screens consistent.',
  tags: ['GraphQL', 'Cache', 'State'],
  doc,
  problem:
    'GraphQL gives field selection, but the front-end still needs a cache strategy that updates one entity everywhere it appears.',
  code: gql`
query Watchlist {
  viewer {
    id
    watchlist {
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
      decision: 'Entity identity',
      good: 'Every cached object has __typename plus a stable id or custom key.',
      risk: 'The same object is stored as several disconnected copies.',
    },
    {
      decision: 'Field policy',
      good: 'Pagination and derived fields define merge/read behavior.',
      risk: 'Pages overwrite each other or stale values survive forever.',
    },
    {
      decision: 'Mutation update',
      good: 'Mutation payload returns the objects needed for normalization.',
      risk: 'The client refetches broadly or manually edits many screens.',
    },
  ],
  exercise: {
    prompt: 'After a token price mutation/subscription, two screens show different prices. What should you inspect?',
    answer: `I would inspect normalization first: does Token have a stable id, is __typename present, and do both screens read the same entity? Then I would inspect the update path: does the mutation/subscription payload include token id and price fields, and does the client write through the normalized cache instead of local component state only?`,
    checklist: [
      'Mentions __typename and id.',
      'Mentions field policies.',
      'Mentions mutation/subscription payload shape.',
      'Avoids screen-local duplicate state.',
    ],
  },
});
