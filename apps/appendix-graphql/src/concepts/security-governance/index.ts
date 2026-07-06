import { gql, makeGraphQLConcept } from '../common';
import doc from './doc.md?raw';

export const securityGovernance = makeGraphQLConcept({
  slug: 'security-governance',
  title: 'Security, governance, and evolution',
  summary: 'GraphQL needs authorization, cost controls, persisted queries, and schema evolution rules.',
  tags: ['GraphQL', 'Security', 'Governance'],
  doc,
  problem:
    'A flexible graph can expose too much unless every field is authorized, costed, observed, and evolved with compatibility rules.',
  code: gql`
directive @deprecated(reason: String) on FIELD_DEFINITION | ENUM_VALUE

type User {
  id: ID!
  displayName: String!
  email: String @deprecated(reason: "Use contactEmail permission-gated field")
  contactEmail: String
}
  `,
  decisionRows: [
    {
      decision: 'Authorization',
      good: 'Authorize per object/field where sensitivity differs.',
      risk: 'A safe parent field leaks sensitive nested fields.',
    },
    {
      decision: 'Query admission',
      good: 'Use persisted queries, depth/complexity limits, and allowlists when needed.',
      risk: 'Arbitrary valid queries can abuse backend resources.',
    },
    {
      decision: 'Schema evolution',
      good: 'Add fields, deprecate old ones, and track client usage before removal.',
      risk: 'Removing or changing fields breaks deployed clients.',
    },
  ],
  exercise: {
    prompt: 'A team wants to expose admin-only fields in the same User type used by normal users. What should you require?',
    answer: `I would require field-level authorization, tests for unauthorized access, clear null/error semantics, and observability for denied fields. If clients can send arbitrary operations, add persisted queries or complexity limits. For schema evolution, add new fields instead of changing old ones, deprecate with a reason, and remove only after client usage is gone.`,
    checklist: [
      'Mentions field-level authorization.',
      'Mentions query cost/admission controls.',
      'Mentions deprecation and compatibility.',
      'Mentions observability/tests.',
    ],
  },
});
