import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const ssrServerRendering = makeAngularConcept({
  slug: 'ssr-server-rendering',
  title: 'Angular SSR vs Server Components',
  summary: 'Angular SSR renders normal Angular components to HTML; it is not React Server Components.',
  tags: ['Angular', 'SSR', 'Architecture'],
  doc,
  reactMentalModel:
    'React Server Components create server-only components and serialize a component payload across a client boundary.',
  angularEquivalent:
    'Angular SSR/prerender executes the same component model on the server to produce HTML, then hydrates on the client.',
  code: `// app.config.server.ts
export const config: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
  ],
};`,
  bridge: [
    {
      react: 'Server Component',
      angular: 'server-rendered Angular component',
      seniorNote: 'Angular does not have an RSC-like server-only component graph boundary.',
    },
    {
      react: "'use client' boundary",
      angular: 'hydration / browser-only guards',
      seniorNote: 'Angular components can run in both environments unless you isolate browser APIs.',
    },
    {
      react: 'RSC payload',
      angular: 'HTML plus transfer cache/state',
      seniorNote: 'Use transfer cache to avoid refetching data immediately after hydration.',
    },
  ],
  exercise: {
    prompt: 'A React RSC architecture is being compared with Angular SSR. Explain the equivalent and non-equivalent parts.',
    reactFirstThinking: [
      'Some React components run only on the server.',
      'Client components are marked with a boundary.',
      'Data can stay server-side in RSC.',
    ],
    angularAnswer: `Angular SSR is not RSC.

Angular renders the application to HTML on the server, sends that HTML, and hydrates it on the client. You can prerender routes, stream/render on request depending on setup, and transfer HTTP data, but Angular does not split the component tree into server-only and client components with a Flight payload.

Guard browser APIs with platform checks and keep secrets in server code, resolvers, API handlers, or backend services, not in shared component classes.`,
    checklist: [
      'Says Angular SSR is not RSC.',
      'Explains HTML plus hydration.',
      'Mentions transfer cache/state.',
      'Warns about browser/server API boundaries.',
    ],
  },
});
