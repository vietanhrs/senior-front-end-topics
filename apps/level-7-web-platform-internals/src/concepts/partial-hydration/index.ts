import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const partialHydration: ConceptModule = {
  slug: 'partial-hydration',
  title: 'Partial hydration',
  summary: 'Hydrate a subset, each on a trigger (eager/idle/visible/interaction); chunks load on demand.',
  tags: ['Hydration', 'Performance', 'Loading'],
  doc,
  Demo,
  Exercise,
};
