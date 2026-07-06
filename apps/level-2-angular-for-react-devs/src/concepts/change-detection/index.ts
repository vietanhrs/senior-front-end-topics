import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const changeDetection = makeAngularConcept({
  slug: 'change-detection',
  title: 'Change detection strategy',
  summary: 'Angular checks view bindings through a tree walk, with Default and OnPush strategies.',
  tags: ['Angular', 'Change detection', 'OnPush'],
  doc,
  reactMentalModel:
    'React re-renders components when state/props change, then reconciles the returned element tree.',
  angularEquivalent:
    'Angular runs change detection over component views and updates only bindings whose values changed.',
  code: `@Component({
  selector: 'price-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <strong>{{ symbol() }}</strong>
    <span>{{ price() | number:'1.2-2' }}</span>
  \`,
})
export class PriceTile {
  symbol = input.required<string>();
  price = input.required<number>();
}`,
  bridge: [
    {
      react: 'render triggered by setState',
      angular: 'view check triggered by dirty marking',
      seniorNote: 'OnPush narrows when a view is checked; it is not the same as React.memo.',
    },
    {
      react: 'memoization bailout',
      angular: 'OnPush plus immutable inputs/signals',
      seniorNote: 'Mutating an object in place can hide changes under both mental models.',
    },
    {
      react: 'effects after render',
      angular: 'lifecycle hooks / effects / afterRender APIs',
      seniorNote: 'Do not put expensive work in getters used by templates; they can run often.',
    },
  ],
  exercise: {
    prompt: 'A React dev ports a memoized component to Angular and mutates input objects in place. Explain the bug.',
    reactFirstThinking: [
      'React.memo can miss updates when props are mutated in place.',
      'Referential equality matters for bailouts.',
    ],
    angularAnswer: `With \`OnPush\`, Angular checks a component when an input reference changes, an event happens in its view, an async pipe emits, a signal marks it dirty, or code explicitly marks it.

If a parent mutates an input object in place, the reference may not change, so the OnPush child can keep showing stale bindings. Use immutable updates, signals, or explicit dirty marking when integrating legacy mutable state.`,
    checklist: [
      'Distinguishes Default and OnPush.',
      'Mentions dirty marking triggers.',
      'Explains reference mutation bug.',
      'Does not equate OnPush exactly with React.memo.',
    ],
  },
});
