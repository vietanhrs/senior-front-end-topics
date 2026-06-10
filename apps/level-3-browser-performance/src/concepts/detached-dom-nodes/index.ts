import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const detachedDomNodes: ConceptModule = {
  slug: 'detached-dom-nodes',
  title: 'Detached DOM nodes',
  summary: 'Removed-but-still-referenced nodes leak memory; find via heap snapshots, fix with cleanup/WeakMap.',
  tags: ['Memory', 'Leaks', 'DOM'],
  doc,
  Demo,
  Exercise,
};
