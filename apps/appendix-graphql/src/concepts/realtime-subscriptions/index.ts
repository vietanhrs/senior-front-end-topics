import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const realtimeSubscriptions = makeGraphQLConcept({
  slug: 'realtime-subscriptions',
  title: 'Subscriptions and realtime updates',
  summary: 'Realtime GraphQL must define ordering, reconnect, backfill, and cache merge semantics.',
  tags: ['GraphQL', 'Realtime', 'Subscriptions'],
  doc,
  problem:
    'Subscriptions are not just queries over WebSocket; production clients need reconnect behavior, missed-event recovery, and deterministic cache writes.',
  code: gql`
subscription PriceChanged($symbols: [String!]!) {
  priceChanged(symbols: $symbols) {
    token {
      id
      symbol
      price { amount currency decimals }
    }
    sequence
    occurredAt
  }
}
  `,
  decisionRows: [
    {
      decision: 'Ordering',
      good: 'Payload includes sequence/version/time so stale events can be ignored.',
      risk: 'Older events overwrite newer state.',
    },
    {
      decision: 'Backfill',
      good: 'Reconnect flow refetches or resumes from last sequence.',
      risk: 'The UI silently misses events while offline.',
    },
    {
      decision: 'Cache write',
      good: 'Subscription payload includes normalized entity identity.',
      risk: 'Realtime state diverges from query state.',
    },
  ],
  exercise: {
    prompt: 'Design realtime token prices for a portfolio page.',
    answer: `Use a subscription only for active symbols, include token id, price, sequence/version, and timestamp, and write updates into the normalized Token entity. On reconnect, refetch the portfolio or resume from the last sequence. The UI should show connection state and avoid applying stale events over fresher query results.`,
    checklist: [
      'Includes entity identity.',
      'Includes ordering/version metadata.',
      'Handles reconnect/backfill.',
      'Writes through normalized cache.',
    ],
  },
});
