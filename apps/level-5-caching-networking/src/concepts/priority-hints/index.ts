import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const priorityHints: ConceptModule = {
  slug: 'priority-hints',
  title: 'Priority hints',
  summary: 'fetchpriority adjusts browser scheduling: promote the LCP image, demote the noise.',
  tags: ['Loading', 'LCP', 'Network'],
  doc,
  Demo,
  Exercise,
};
