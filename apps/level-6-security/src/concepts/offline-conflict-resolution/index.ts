import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const offlineConflict: ConceptModule = {
  slug: 'offline-conflict-resolution',
  title: 'Offline conflict resolution',
  summary: 'Diverging offline replicas: LWW (lossy) vs CRDT merge (counter=sum, set=union); version vectors detect concurrency.',
  tags: ['Offline', 'Sync', 'State'],
  doc,
  Demo,
  Exercise,
};
