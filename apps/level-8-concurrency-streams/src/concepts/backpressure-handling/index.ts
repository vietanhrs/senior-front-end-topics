import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const backpressureHandling: ConceptModule = {
  slug: 'backpressure-handling',
  title: 'Backpressure handling',
  summary: 'Slow consumers pushing back on fast producers: pull-based streams, desiredSize, and bounded queues vs unbounded buffering.',
  tags: ['Streams', 'Concurrency', 'Performance'],
  doc,
  Demo,
  Exercise,
};
