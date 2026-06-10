import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const optimisticUi: ConceptModule = {
  slug: 'optimistic-ui',
  title: 'Optimistic UI rollback strategy',
  summary: 'Apply expected result instantly; snapshot, reconcile with the server, roll back on failure.',
  tags: ['Async', 'UX', 'State'],
  doc,
  Demo,
  Exercise,
};
