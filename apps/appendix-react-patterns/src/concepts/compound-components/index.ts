import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const compoundComponents: ConceptModule = {
  slug: 'compound-components',
  title: 'Compound Components',
  summary: 'Pieces that coordinate via implicit context state and compose as declarative children (Tabs.List/Tab/Panel).',
  tags: ['Pattern', 'Composition', 'Context'],
  doc,
  Demo,
  Exercise,
};
