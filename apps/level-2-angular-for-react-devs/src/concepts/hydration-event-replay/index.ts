import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const hydrationEventReplay = makeAngularConcept({
  slug: 'hydration-event-replay',
  title: 'Hydration, event replay, and incremental hydration',
  summary: 'Angular can reuse SSR DOM, replay early events, and hydrate deferred islands incrementally.',
  tags: ['Angular', 'Hydration', 'SSR'],
  doc,
  reactMentalModel:
    'React hydrateRoot attaches to server HTML, and selective hydration prioritizes interacted boundaries.',
  angularEquivalent:
    'Angular provideClientHydration can reuse DOM, transfer HTTP cache, replay events, and hydrate defer blocks incrementally.',
  code: `bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(
      withEventReplay(),
      withIncrementalHydration(),
    ),
  ],
});`,
  bridge: [
    {
      react: 'hydrateRoot',
      angular: 'provideClientHydration',
      seniorNote: 'Both require server and first client render to agree structurally.',
    },
    {
      react: 'event replay for selective hydration',
      angular: 'withEventReplay',
      seniorNote: 'Early clicks can be captured and replayed after Angular listeners attach.',
    },
    {
      react: 'Suspense hydration boundary',
      angular: '@defer incremental hydration boundary',
      seniorNote: 'Angular incremental hydration is tied to deferrable views.',
    },
  ],
  exercise: {
    prompt: 'A server-rendered Angular page loses a click before the bundle loads. What should be enabled and what must be audited?',
    reactFirstThinking: [
      'In React, event replay prevents clicks on unhydrated boundaries from being lost.',
      'Hydration mismatch can force replacement.',
    ],
    angularAnswer: `Enable client hydration with event replay.

\`\`\`ts
provideClientHydration(withEventReplay())
\`\`\`

Then audit deterministic server/client markup: no random IDs, time-dependent text, browser-only branches during initial render, or DOM mutation before hydration. If using \`@defer\`, evaluate \`withIncrementalHydration()\` for below-the-fold blocks.`,
    checklist: [
      'Mentions provideClientHydration.',
      'Mentions withEventReplay.',
      'Audits mismatch causes.',
      'Connects incremental hydration to @defer.',
    ],
  },
});
