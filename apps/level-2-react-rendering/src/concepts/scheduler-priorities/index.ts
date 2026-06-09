import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const schedulerPriorities: ConceptModule = {
  slug: 'scheduler-priorities',
  title: 'Scheduler priorities',
  summary: 'Lanes & priority tiers: urgent updates preempt transitions; automatic batching.',
  tags: ['React', 'Concurrency', 'Internals'],
  doc,
  Demo,
  Exercise,
};
