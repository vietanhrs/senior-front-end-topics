import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const staleWhileRevalidate: ConceptModule = {
  slug: 'stale-while-revalidate',
  title: 'Stale-while-revalidate',
  summary: 'Serve cached data instantly, revalidate in the background — the HTTP header and the UI pattern.',
  tags: ['Caching', 'HTTP', 'UX'],
  doc,
  Demo,
  Exercise,
};
