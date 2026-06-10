import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const idempotentActions: ConceptModule = {
  slug: 'idempotent-actions',
  title: 'Idempotent UI actions',
  summary: 'Make actions safe to repeat: client guards catch double-clicks; idempotency keys stop dup effects.',
  tags: ['Reliability', 'Network', 'UX'],
  doc,
  Demo,
  Exercise,
};
