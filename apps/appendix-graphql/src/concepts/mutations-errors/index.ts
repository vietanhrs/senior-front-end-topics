import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const mutationsErrors = makeGraphQLConcept({
  slug: 'mutations-errors',
  title: 'Mutations and error semantics',
  summary: 'Mutation design must separate transport errors, GraphQL errors, and domain errors.',
  tags: ['GraphQL', 'Mutations', 'Errors'],
  doc,
  problem:
    'A mutation is not just a POST with a different syntax; the client needs predictable success payloads, validation errors, optimistic behavior, and rollback semantics.',
  code: gql`
mutation RenamePortfolio($input: RenamePortfolioInput!) {
  renamePortfolio(input: $input) {
    portfolio {
      id
      name
      updatedAt
    }
    userErrors {
      field
      code
      message
    }
  }
}
  `,
  decisionRows: [
    {
      decision: 'Payload shape',
      good: 'Return the changed entity or enough fields to update cache deterministically.',
      risk: 'The UI must refetch too broadly or manually guess the new cache state.',
    },
    {
      decision: 'Domain errors',
      good: 'Use typed userErrors for validation/business failures.',
      risk: 'All failures become generic toast messages.',
    },
    {
      decision: 'Idempotency',
      good: 'Use clientMutationId or server idempotency keys for repeatable actions.',
      risk: 'Retries can duplicate user-visible effects.',
    },
  ],
  exercise: {
    prompt: 'Design a mutation for placing an order from a front-end page.',
    answer: `The mutation should accept a typed input object, include an idempotency key, and return either the created order summary or typed userErrors. Transport or GraphQL execution errors mean the operation status is unknown; domain userErrors mean the request was handled and rejected. The client can optimistically disable the submit button but should only show confirmed order state after the mutation response or a reconciled cache update.`,
    checklist: [
      'Separates transport/execution/domain errors.',
      'Includes idempotency.',
      'Returns changed entity fields.',
      'Describes optimistic and rollback behavior.',
    ],
  },
});
