import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const signalsReactivity = makeAngularConcept({
  slug: 'signals-reactivity',
  title: 'Signals and fine-grained reactivity',
  summary: 'Angular signals model state as readable functions with computed dependencies and effects.',
  tags: ['Angular', 'Signals', 'State'],
  doc,
  reactMentalModel:
    'React useState stores component state; useMemo derives values; useEffect reacts after render.',
  angularEquivalent:
    'Angular signal(), computed(), and effect() form a dependency graph that marks consumers dirty.',
  code: `const quantity = signal(1);
const unitPrice = signal(12);
const total = computed(() => quantity() * unitPrice());

effect(() => {
  console.log('total changed', total());
});`,
  bridge: [
    {
      react: 'useState setter',
      angular: 'signal.set/update',
      seniorNote: 'Reading a signal is a function call; that read registers dependency in reactive contexts.',
    },
    {
      react: 'useMemo',
      angular: 'computed',
      seniorNote: 'Computed signals are lazy, cached, and dependency-tracked.',
    },
    {
      react: 'useEffect',
      angular: 'effect',
      seniorNote: 'Effects need an injection context and cleanup; do not use them for simple derivations.',
    },
  ],
  exercise: {
    prompt: 'Translate a React component with count state, derived total, and a logging effect into Angular signals.',
    reactFirstThinking: [
      'useState for writable state.',
      'useMemo for derived values.',
      'useEffect for logging and cleanup.',
    ],
    angularAnswer: `Use \`signal\` for writable state, \`computed\` for derivation, and \`effect\` only for side effects.

\`\`\`ts
count = signal(0);
total = computed(() => this.count() * this.unitPrice());

private log = effect(() => {
  analytics.totalSeen(this.total());
});
\`\`\`

Keep pure derivation in \`computed\`; do not move it into \`effect\` just because it looks like useEffect.`,
    checklist: [
      'Uses signal reads as function calls.',
      'Uses computed for derivation.',
      'Uses effect only for side effects.',
      'Mentions cleanup/injection context when side effects subscribe externally.',
    ],
  },
});
