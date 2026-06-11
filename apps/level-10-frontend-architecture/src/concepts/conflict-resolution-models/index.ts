import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const conflictResolutionModels: ConceptModule = {
  slug: 'conflict-resolution-models',
  title: 'Conflict resolution models',
  summary: 'Detect (version vectors) vs resolve (LWW, three-way merge, CRDT, manual); per-field policy by intent instead of lossy whole-record LWW.',
  tags: ['Architecture', 'Sync', 'Distributed'],
  doc,
  Demo,
  Exercise,
};
