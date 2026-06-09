import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const concurrentRendering: ConceptModule = {
  slug: 'concurrent-rendering',
  title: 'Concurrent rendering',
  summary: 'Interruptible, cooperative rendering: keep urgent updates snappy via transitions/deferred values.',
  tags: ['React', 'Concurrency', 'Performance'],
  doc,
  Demo,
  Exercise,
};
