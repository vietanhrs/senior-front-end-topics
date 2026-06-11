import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const taskStarvation: ConceptModule = {
  slug: 'task-starvation',
  title: 'Task starvation',
  summary: 'Why a self-replenishing microtask chain starves timers, input, and paint — and how yielding fixes it.',
  tags: ['Event loop', 'Scheduling', 'Performance'],
  doc,
  Demo,
  Exercise,
};
