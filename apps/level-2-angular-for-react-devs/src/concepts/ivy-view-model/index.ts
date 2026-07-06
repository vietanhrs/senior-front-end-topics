import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const ivyViewModel = makeAngularConcept({
  slug: 'ivy-view-model',
  title: 'Ivy view model',
  summary: 'Ivy stores template metadata and live view state in TView/LView structures.',
  tags: ['Angular', 'Ivy', 'Internals'],
  doc,
  reactMentalModel:
    'React Fiber is a mutable work node per component/host element, used for state and scheduling.',
  angularEquivalent:
    'Angular Ivy uses TView for static template metadata and LView for live instance/binding state.',
  code: `// Conceptual Ivy shape, not public API.
type TView = {
  template: Function;
  bindingStartIndex: number;
  cleanup: unknown[];
};

type LView = [
  hostNode: Node,
  component: UserCard,
  flags: number,
  ...bindingSlots: unknown[],
];`,
  bridge: [
    {
      react: 'Fiber node',
      angular: 'LView plus TView',
      seniorNote: 'Do not look for a Fiber tree; Angular has view arrays and template instructions.',
    },
    {
      react: 'element type / props',
      angular: 'template opcodes / binding slots',
      seniorNote: 'Ivy optimizes fixed template structure by index, not by recreating element objects.',
    },
    {
      react: 'render phase',
      angular: 'template refresh pass',
      seniorNote: 'Angular re-runs binding instructions to update the existing view.',
    },
  ],
  exercise: {
    prompt: 'A teammate says Angular must diff a Virtual DOM because templates re-render. Correct the model.',
    reactFirstThinking: [
      'React creates a new element tree and reconciles it against previous fibers.',
      'Fiber keeps work and state between renders.',
    ],
    angularAnswer: `Angular does not build and diff a Virtual DOM for normal rendering.

Ivy compiles the template into create/update instructions. Static template metadata is stored in a TView; live component, DOM, directive, and binding values are stored in LView slots. During change detection Angular executes the update instructions and writes changed bindings to the existing DOM.`,
    checklist: [
      'Explicitly says no normal VDOM diff.',
      'Names TView and LView.',
      'Explains binding slots and update instructions.',
      'Avoids relying on private fields as public API.',
    ],
  },
});
