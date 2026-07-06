import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const rxjsExternalState = makeAngularConcept({
  slug: 'rxjs-external-state',
  title: 'RxJS and external state consistency',
  summary: 'Angular apps often integrate external state through Observables, async pipe, and toSignal.',
  tags: ['Angular', 'RxJS', 'State'],
  doc,
  reactMentalModel:
    'React useSyncExternalStore gives React a stable snapshot and subscription protocol for external stores.',
  angularEquivalent:
    'Angular consumes external streams with async pipe, toSignal, stores, and lifecycle-aware subscriptions.',
  code: `readonly user = toSignal(
  this.userService.user$.pipe(distinctUntilChanged()),
  { initialValue: null },
);`,
  bridge: [
    {
      react: 'useSyncExternalStore',
      angular: 'async pipe / toSignal',
      seniorNote: 'Prefer framework-aware adapters over manual subscribe plus assignment.',
    },
    {
      react: 'snapshot consistency',
      angular: 'single stream emission -> one dirty-marked view update',
      seniorNote: 'Share streams when multiple consumers must see the same emission.',
    },
    {
      react: 'unsubscribe cleanup',
      angular: 'async pipe / takeUntilDestroyed',
      seniorNote: 'Manual subscriptions are review hotspots.',
    },
  ],
  exercise: {
    prompt: 'Replace manual RxJS subscriptions in ngOnInit with an Angular-consistent state bridge.',
    reactFirstThinking: [
      'External stores need a subscription protocol.',
      'Components must unsubscribe.',
      'All readers should see one coherent snapshot.',
    ],
    angularAnswer: `Prefer template-owned or signal-owned subscriptions.

\`\`\`ts
user = toSignal(this.userService.user$, { initialValue: null });
\`\`\`

or in the template:

\`\`\`html
@if (userService.user$ | async; as user) {
  <user-card [user]="user" />
}
\`\`\`

If manual subscription is unavoidable, use \`takeUntilDestroyed()\` and keep the write path small.`,
    checklist: [
      'Uses async pipe or toSignal.',
      'Mentions takeUntilDestroyed for manual subscriptions.',
      'Mentions shared emissions/coherent state.',
      'Avoids naked subscribe in ngOnInit.',
    ],
  },
});
