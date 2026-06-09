import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const workers: ConceptModule = {
  slug: 'workers',
  title: 'Web workers vs Service workers',
  summary: 'Web Worker = compute off the main thread; Service Worker = network proxy/offline/push.',
  tags: ['Concurrency', 'PWA', 'Performance'],
  doc,
  Demo,
  Exercise,
};
