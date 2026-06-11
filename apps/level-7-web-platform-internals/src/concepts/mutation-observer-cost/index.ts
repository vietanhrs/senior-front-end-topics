import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const mutationObserverCost: ConceptModule = {
  slug: 'mutation-observer-cost',
  title: 'MutationObserver cost',
  summary: 'Async batched DOM-change records: where the cost is (subtree, per-record work), self-trigger loops, and takeRecords.',
  tags: ['Observers', 'Performance', 'DOM'],
  doc,
  Demo,
  Exercise,
};
