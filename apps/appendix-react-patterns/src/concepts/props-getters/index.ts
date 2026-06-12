import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const propsGetters: ConceptModule = {
  slug: 'props-getters',
  title: 'Props Getters',
  summary: 'Getters that return the full prop bundle (handlers + ARIA + ids) to spread onto elements — correct-by-default, with composed handlers.',
  tags: ['Pattern', 'Accessibility', 'Reuse'],
  doc,
  Demo,
  Exercise,
};
