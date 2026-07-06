import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const paginationConnections = makeGraphQLConcept({
  slug: 'pagination-connections',
  title: 'Pagination and connections',
  summary: 'Cursor pagination makes infinite lists stable under inserts, deletes, and filtering.',
  tags: ['GraphQL', 'Pagination', 'UX'],
  doc,
  problem:
    'Offset pagination is easy but unstable for fast-changing feeds; cursor connections let the client request windows relative to a known edge.',
  code: gql`
query Transactions($accountId: ID!, $first: Int!, $after: String) {
  account(id: $accountId) {
    id
    transactions(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          amount { amount currency decimals }
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
  `,
  decisionRows: [
    {
      decision: 'Cursor meaning',
      good: 'Cursor is opaque and stable for the chosen sort/filter.',
      risk: 'Clients depend on implementation details and break during backend changes.',
    },
    {
      decision: 'Merge policy',
      good: 'Client cache defines how new pages append/prepend without duplicates.',
      risk: 'Infinite scroll repeats or drops rows.',
    },
    {
      decision: 'Filter reset',
      good: 'Changing filters resets cursor and cache key.',
      risk: 'Rows from different result sets merge together.',
    },
  ],
  exercise: {
    prompt: 'A transaction list supports filters, infinite scroll, and live inserts. What must the GraphQL contract include?',
    answer: `Use cursor-based pagination with a stable sort, opaque cursors, pageInfo, and node IDs. The client cache key must include filters and sort. Live inserts should either prepend via subscription/updateQuery or invalidate the connection deliberately. Never merge pages from different filter variables.`,
    checklist: [
      'Uses cursor pagination.',
      'Includes pageInfo.',
      'Mentions cache merge policy.',
      'Handles filter/sort changes.',
    ],
  },
});
