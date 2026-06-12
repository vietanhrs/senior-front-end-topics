import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const indexeddbScaling: ConceptModule = {
  slug: 'indexeddb-scaling',
  title: 'IndexedDB scaling strategy',
  summary: 'Make client storage scale: index your queries, batch writes in one transaction, cursor pagination, and the transaction-lifecycle traps.',
  tags: ['Architecture', 'Storage', 'Offline'],
  doc,
  Demo,
  Exercise,
};
