import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const vdomDiffing: ConceptModule = {
  slug: 'vdom-diffing',
  title: 'Virtual DOM diffing complexity',
  summary: 'Why diffing drops from O(n³) to O(n) via type + key heuristics, and the key=index trap.',
  tags: ['React', 'Reconciliation', 'Complexity'],
  doc,
  Demo,
  Exercise,
};
