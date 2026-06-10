import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const memoizationPitfalls: ConceptModule = {
  slug: 'memoization-pitfalls',
  title: 'Memoization pitfalls',
  summary: 'Broken caches: unstable deps, trivial memos, children-defeated memo, side effects in useMemo.',
  tags: ['React', 'Memoization', 'Performance'],
  doc,
  Demo,
  Exercise,
};
