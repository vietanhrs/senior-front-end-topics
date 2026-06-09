import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const workers: ConceptModule = {
  slug: 'workers',
  title: 'Web workers vs Service workers',
  summary: 'Web Worker = tính toán off main thread; Service Worker = proxy mạng/offline/push.',
  tags: ['Concurrency', 'PWA', 'Performance'],
  doc,
  Demo,
  Exercise,
};
