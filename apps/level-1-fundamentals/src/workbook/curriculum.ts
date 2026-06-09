/**
 * The full roadmap, shown in the sidebar so readers see where Level 1 sits.
 * Only Level 1 is interactive in this app; later levels live in sibling
 * workspace apps (apps/level-2-..., etc.) and are marked "coming soon" here.
 */
export interface RoadmapLevel {
  level: number;
  title: string;
  status: 'active' | 'planned';
  concepts: string[];
}

export const ROADMAP: RoadmapLevel[] = [
  {
    level: 1,
    title: 'Fundamentals (clear, never fuzzy)',
    status: 'active',
    concepts: [
      'Hydration',
      'Virtual DOM diffing complexity',
      'Event loop (macro vs microtasks)',
      'Critical rendering path',
      'Code splitting strategies',
      'Dynamic import chunking',
      'Preload vs Prefetch vs Preconnect',
      'CORS preflight',
      'CSRF vs XSS mitigation',
      'Web workers vs Service workers',
    ],
  },
  {
    level: 2,
    title: 'React Core & Rendering Mechanics',
    status: 'planned',
    concepts: [
      'Reconciliation algorithm',
      'Fiber architecture',
      'Concurrent rendering',
      'Time slicing',
      'Scheduler priorities',
      'Suspense boundaries',
      'Selective hydration',
      'Server components',
      'Tearing in concurrent UI',
      'Stale closure problems',
    ],
  },
  {
    level: 3,
    title: 'Browser Performance',
    status: 'planned',
    concepts: [
      'Layout thrashing',
      'Paint vs Layout vs Composite',
      'Browser compositing layers',
      'GPU acceleration in CSS',
      'CSS containment',
      'Render blocking resources',
      'Render waterfall',
      'Subpixel rendering',
      'Detached DOM nodes',
      'Garbage collection timing',
    ],
  },
  {
    level: 4,
    title: 'Advanced Data & State',
    status: 'planned',
    concepts: [
      'Structural sharing',
      'Immutable data patterns',
      'Referential equality',
      'Memoization pitfalls',
      'Race conditions in UI state',
      'Finite state modeling',
      'Event sourcing in frontend',
      'Optimistic UI rollback',
      'Deterministic rendering',
      'Idempotent UI actions',
    ],
  },
  {
    level: 5,
    title: 'Caching & Networking',
    status: 'planned',
    concepts: [
      'Cache invalidation strategies',
      'Stale-while-revalidate',
      'ETag vs Cache-control',
      'HTTP/3 and QUIC',
      'Backpressure in Streams API',
      'AbortController',
      'Streaming fetch response handling',
      'Priority hints',
      'SameSite cookie modes',
      'Speculative prerendering',
    ],
  },
  {
    level: 6,
    title: 'Security',
    status: 'planned',
    concepts: [
      'CSP (Content Security Policy)',
      'Trusted Types',
      'DOM clobbering',
      'Prototype pollution',
      'Same-origin policy nuances',
      'Service Worker lifecycle traps',
      'SharedArrayBuffer',
      'Transferable objects',
      'CORS preflight internals',
      'Offline conflict resolution',
    ],
  },
];
