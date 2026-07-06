import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const schedulingWork = makeAngularConcept({
  slug: 'scheduling-work',
  title: 'Scheduling work without Fiber lanes',
  summary: 'Angular does not expose React-style lanes; senior code schedules expensive work explicitly.',
  tags: ['Angular', 'Performance', 'Scheduling'],
  doc,
  reactMentalModel:
    'React transitions and deferred values let expensive rendering become lower priority.',
  angularEquivalent:
    'Angular leans on change-detection scope, RxJS schedulers/operators, deferrable views, workers, and virtualization.',
  code: `results$ = this.search.valueChanges.pipe(
  debounceTime(150),
  distinctUntilChanged(),
  switchMap((term) => this.api.search(term)),
  shareReplay({ bufferSize: 1, refCount: true }),
);`,
  bridge: [
    {
      react: 'lanes / transition priority',
      angular: 'no direct lane equivalent',
      seniorNote: 'Use this absence as design input; move cost out of the hot path.',
    },
    {
      react: 'useDeferredValue',
      angular: 'debounce/audit/switchMap/virtual scroll',
      seniorNote: 'RxJS controls source frequency and cancellation before Angular checks the view.',
    },
    {
      react: 'time slicing render work',
      angular: 'chunk CPU work / Web Worker / afterNextRender',
      seniorNote: 'Angular will not automatically slice arbitrary CPU loops for you.',
    },
  ],
  exercise: {
    prompt: 'A React transition search UI is being ported to Angular. The input must stay responsive while results update.',
    reactFirstThinking: [
      'Input update is urgent.',
      'List filtering/rendering is non-urgent.',
      'Cancel stale requests.',
    ],
    angularAnswer: `Model the search as a stream.

\`\`\`ts
results$ = this.query.valueChanges.pipe(
  debounceTime(150),
  distinctUntilChanged(),
  switchMap((query) => this.api.search(query)),
);
\`\`\`

Render with \`async\` pipe, virtualize large lists, and move CPU-heavy filtering to a worker or pre-indexed data structure. Angular does not give you a \`startTransition\` clone; you design the data and work pipeline explicitly.`,
    checklist: [
      'Separates urgent input from expensive results.',
      'Uses switchMap or cancellation.',
      'Mentions virtualization/worker for big CPU or DOM cost.',
      'Does not invent Angular lanes.',
    ],
  },
});
