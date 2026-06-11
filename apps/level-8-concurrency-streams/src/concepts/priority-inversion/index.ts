import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const priorityInversion: ConceptModule = {
  slug: 'priority-inversion',
  title: 'Priority inversion in async code',
  summary: 'High-priority work blocked on a resource held by low-priority work that medium work preempts — and priority inheritance as the fix.',
  tags: ['Scheduling', 'Concurrency', 'Locks'],
  doc,
  Demo,
  Exercise,
};
