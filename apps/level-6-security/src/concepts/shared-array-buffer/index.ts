import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const sharedArrayBuffer: ConceptModule = {
  slug: 'shared-array-buffer',
  title: 'SharedArrayBuffer',
  summary: 'Real cross-thread shared memory; gated by cross-origin isolation (Spectre); needs Atomics for correctness.',
  tags: ['Security', 'Concurrency', 'Isolation'],
  doc,
  Demo,
  Exercise,
};
