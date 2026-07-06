import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const deferrableViews = makeAngularConcept({
  slug: 'deferrable-views',
  title: 'Deferrable views and loading boundaries',
  summary: 'Angular @defer gives template-level lazy loading with placeholder/loading/error states.',
  tags: ['Angular', 'Code splitting', 'UX'],
  doc,
  reactMentalModel:
    'React.lazy plus Suspense defines a boundary around code or data that is not ready yet.',
  angularEquivalent:
    'Angular @defer defines a lazy template block with triggers and placeholder/loading/error blocks.',
  code: `@defer (on viewport; prefetch on idle) {
  <expensive-chart [data]="data()" />
} @placeholder {
  <chart-skeleton />
} @loading (minimum 300ms) {
  <spinner />
} @error {
  <retry-panel />
}`,
  bridge: [
    {
      react: 'Suspense boundary',
      angular: '@defer block',
      seniorNote: 'Angular defer is primarily a template/code-loading primitive, not a generic promise throw model.',
    },
    {
      react: 'fallback prop',
      angular: '@placeholder / @loading / @error',
      seniorNote: 'Angular separates empty placeholder from active loading UI.',
    },
    {
      react: 'lazy import trigger',
      angular: 'on viewport/interaction/idle/timer/custom',
      seniorNote: 'Pick triggers from user intent and LCP risk, not from framework fashion.',
    },
  ],
  exercise: {
    prompt: 'Replace a React.lazy chart with an Angular template that waits until the chart is visible.',
    reactFirstThinking: [
      'Lazy-load the heavy chart chunk.',
      'Show a stable placeholder.',
      'Avoid hurting LCP.',
    ],
    angularAnswer: `Use \`@defer\` with an explicit trigger.

\`\`\`html
@defer (on viewport; prefetch on idle) {
  <portfolio-chart [points]="points()" />
} @placeholder {
  <chart-skeleton />
} @loading (minimum 250ms) {
  <chart-skeleton state="loading" />
} @error {
  <chart-error />
}
\`\`\`

Reserve layout space in the placeholder so the loaded chart does not create CLS.`,
    checklist: [
      'Uses @defer.',
      'Chooses viewport or interaction trigger.',
      'Includes placeholder/loading/error.',
      'Mentions CLS/layout stability.',
    ],
  },
});
