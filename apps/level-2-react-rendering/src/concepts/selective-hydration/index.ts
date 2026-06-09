import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const selectiveHydration: ConceptModule = {
  slug: 'selective-hydration',
  title: 'Selective hydration',
  summary: 'Suspense lets boundaries hydrate independently, out of order, and prioritized by user clicks.',
  tags: ['React', 'SSR', 'Hydration'],
  doc,
  Demo,
  Exercise,
};
