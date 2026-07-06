import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const staleCapturesLifecycle = makeAngularConcept({
  slug: 'stale-captures-lifecycle',
  title: 'Stale captures and lifecycle cleanup',
  summary: 'Angular avoids React hook dependency arrays, but stale callbacks and leaked subscriptions still exist.',
  tags: ['Angular', 'Lifecycle', 'Correctness'],
  doc,
  reactMentalModel:
    'React stale closures happen when callbacks/effects capture values from an old render.',
  angularEquivalent:
    'Angular callbacks can capture constructor/ngOnInit values, while subscriptions and effects need DestroyRef cleanup.',
  code: `private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.socket.messages$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((message) => {
      this.latestMessage.set(message);
    });
}`,
  bridge: [
    {
      react: 'exhaustive-deps rule',
      angular: 'signals/computed/effect dependencies',
      seniorNote: 'Angular has fewer dependency arrays, but reactive reads still define dependencies.',
    },
    {
      react: 'effect cleanup return',
      angular: 'DestroyRef / takeUntilDestroyed / effect cleanup',
      seniorNote: 'Leaks move from missing effect cleanup to missing subscription teardown.',
    },
    {
      react: 'stale event handler',
      angular: 'callback capturing an old input/service value',
      seniorNote: 'Read a signal at call time when you need the latest value.',
    },
  ],
  exercise: {
    prompt: 'A component subscribes once in ngOnInit and closes over the initial input value. Fix the stale capture and cleanup.',
    reactFirstThinking: [
      'React would need dependencies or a ref/latest getter.',
      'Cleanup prevents late writes after unmount.',
    ],
    angularAnswer: `Use a reactive read for current input and lifecycle-aware teardown.

\`\`\`ts
currentAccount = input.required<Account>();

ngOnInit() {
  this.events$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((event) => {
      const account = this.currentAccount();
      this.applyEvent(account.id, event);
    });
}
\`\`\`

If the derivation is pure, prefer \`computed\`; if it is an external side effect, use \`effect\` with cleanup or RxJS teardown.`,
    checklist: [
      'Reads current signal/input at use time.',
      'Uses DestroyRef or takeUntilDestroyed.',
      'Distinguishes computed from effect/subscription.',
      'Names the stale capture risk even without hooks.',
    ],
  },
});
