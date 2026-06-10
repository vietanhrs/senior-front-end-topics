import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const transferableObjects: ConceptModule = {
  slug: 'transferable-objects',
  title: 'Transferable objects',
  summary: 'Zero-copy handoff of ArrayBuffers across threads; the sender buffer becomes detached.',
  tags: ['Concurrency', 'Performance', 'Workers'],
  doc,
  Demo,
  Exercise,
};
