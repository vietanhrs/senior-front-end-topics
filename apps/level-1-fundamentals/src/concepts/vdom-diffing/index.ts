import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const vdomDiffing: ConceptModule = {
  slug: 'vdom-diffing',
  title: 'Virtual DOM diffing complexity',
  summary: 'Vì sao diff O(n³) hạ về O(n) nhờ heuristic type + key, và bẫy key=index.',
  tags: ['React', 'Reconciliation', 'Complexity'],
  doc,
  Demo,
  Exercise,
};
