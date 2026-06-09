import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const tearing: ConceptModule = {
  slug: 'tearing',
  title: 'Tearing in concurrent UI',
  summary: 'Inconsistent reads of an external store mid-render; fix with useSyncExternalStore.',
  tags: ['React', 'Concurrency', 'State'],
  doc,
  Demo,
  Exercise,
};
