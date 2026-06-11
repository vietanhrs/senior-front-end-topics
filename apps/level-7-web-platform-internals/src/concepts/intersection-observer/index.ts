import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const intersectionObserver: ConceptModule = {
  slug: 'intersection-observer',
  title: 'IntersectionObserver internals',
  summary: 'Async, batched visibility off the jank path; thresholds, rootMargin, initial callback, one observer many targets.',
  tags: ['Observers', 'Performance', 'DOM'],
  doc,
  Demo,
  Exercise,
};
