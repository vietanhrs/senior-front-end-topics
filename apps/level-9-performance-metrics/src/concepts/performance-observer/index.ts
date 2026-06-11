import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const performanceObserver: ConceptModule = {
  slug: 'performance-observer',
  title: 'PerformanceObserver API',
  summary: 'The one async, buffered, push-based API behind every metric: entry types, supportedEntryTypes, takeRecords, User Timing.',
  tags: ['Performance', 'Metrics', 'Observers'],
  doc,
  Demo,
  Exercise,
};
