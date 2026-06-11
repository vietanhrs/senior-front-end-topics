import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const sharedMemoryModels: ConceptModule = {
  slug: 'shared-memory-models',
  title: 'Shared memory models',
  summary: 'SC-DRF, atomics as memory barriers, store-release/load-acquire publication, and wait/notify over SharedArrayBuffer.',
  tags: ['Concurrency', 'Memory', 'Workers'],
  doc,
  Demo,
  Exercise,
};
