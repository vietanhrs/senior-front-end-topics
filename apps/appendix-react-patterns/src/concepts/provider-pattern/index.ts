import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const providerPattern: ConceptModule = {
  slug: 'provider-pattern',
  title: 'Provider Pattern',
  summary: 'Share values across a subtree via Context + a typed hook — with memoized values and split contexts to control re-renders.',
  tags: ['Pattern', 'Context', 'State'],
  doc,
  Demo,
  Exercise,
};
