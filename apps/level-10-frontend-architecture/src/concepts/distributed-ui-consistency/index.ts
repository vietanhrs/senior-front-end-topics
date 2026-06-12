import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const distributedUiConsistency: ConceptModule = {
  slug: 'distributed-ui-consistency',
  title: 'Distributed UI consistency',
  summary: 'Tabs/devices/cache/server as replicas: consistency models, BroadcastChannel sync, monotonic versioning, and Web Locks leader election.',
  tags: ['Architecture', 'Distributed', 'State'],
  doc,
  Demo,
  Exercise,
};
