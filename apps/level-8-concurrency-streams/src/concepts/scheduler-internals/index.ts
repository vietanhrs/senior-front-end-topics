import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const schedulerInternals: ConceptModule = {
  slug: 'scheduler-internals',
  title: 'Scheduler internals',
  summary: 'How React/postTask schedule work: a min-heap by expiration, 5ms time slices, and MessageChannel yielding.',
  tags: ['Scheduling', 'React', 'Event loop'],
  doc,
  Demo,
  Exercise,
};
