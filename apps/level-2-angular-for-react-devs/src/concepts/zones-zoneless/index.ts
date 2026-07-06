import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const zonesZoneless = makeAngularConcept({
  slug: 'zones-zoneless',
  title: 'Zone.js, zoneless, and dirty marking',
  summary: 'Angular can use Zone.js to discover async work, or run zoneless with explicit reactivity.',
  tags: ['Angular', 'Zone.js', 'Scheduling'],
  doc,
  reactMentalModel:
    'React schedules updates because you call setState, dispatch, or an external store subscription notifies React.',
  angularEquivalent:
    'Angular with Zone.js patches async APIs and triggers change detection; zoneless Angular relies on signals and explicit marks.',
  code: `bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
  ],
});`,
  bridge: [
    {
      react: 'setState schedules work',
      angular: 'Zone.js triggers an application tick',
      seniorNote: 'Zone.js notices async completion; it does not tell Angular exactly what data changed.',
    },
    {
      react: 'external store subscription',
      angular: 'signal/markForCheck/ChangeDetectorRef',
      seniorNote: 'In zoneless mode, explicit dirty marking becomes part of integration design.',
    },
    {
      react: 'automatic batching',
      angular: 'coalescing / signal scheduling',
      seniorNote: 'Do not assume every async callback should re-check the whole app.',
    },
  ],
  exercise: {
    prompt: 'A widget updates from a third-party callback outside Angular and the UI stays stale in zoneless mode. Fix the integration.',
    reactFirstThinking: [
      'A React external store must notify React.',
      'The view changes only after React is told about the new snapshot.',
    ],
    angularAnswer: `Bridge the callback into Angular reactivity.

- Write callback values into a \`signal\`, or
- call \`ChangeDetectorRef.markForCheck()\` for an OnPush component, or
- wrap the source in an Observable consumed by \`async\` pipe / \`toSignal\`.

In zoneless mode, do not depend on Zone.js to notice the callback and trigger a tick.`,
    checklist: [
      'Names Zone.js behavior.',
      'Names zoneless explicit reactivity.',
      'Uses signal, async pipe, toSignal, or markForCheck.',
      'Avoids global tick as the default answer.',
    ],
  },
});
