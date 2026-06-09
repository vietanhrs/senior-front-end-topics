import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const reconciliation: ConceptModule = {
  slug: 'reconciliation',
  title: 'Reconciliation algorithm',
  summary: 'State lives at (position + type + key); when React preserves vs remounts an instance.',
  tags: ['React', 'Rendering', 'State'],
  doc,
  Demo,
  Exercise,
};
