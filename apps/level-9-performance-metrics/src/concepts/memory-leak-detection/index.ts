import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const memoryLeakDetection: ConceptModule = {
  slug: 'memory-leak-detection',
  title: 'Browser memory leak detection',
  summary: 'Detached DOM, forgotten listeners/timers, unbounded caches; heap snapshots, Performance Monitor, WeakMap/WeakRef fixes.',
  tags: ['Memory', 'Performance', 'DevTools'],
  doc,
  Demo,
  Exercise,
};
