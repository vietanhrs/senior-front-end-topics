import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const longTasks: ConceptModule = {
  slug: 'long-tasks',
  title: 'Long Tasks API',
  summary: 'Tasks over 50ms block the thread; the longtask entry, Total Blocking Time, LoAF attribution, and chunking the fix.',
  tags: ['Performance', 'Metrics', 'Main thread'],
  doc,
  Demo,
  Exercise,
};
