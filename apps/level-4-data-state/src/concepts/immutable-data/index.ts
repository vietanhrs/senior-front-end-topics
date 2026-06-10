import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const immutableData: ConceptModule = {
  slug: 'immutable-data',
  title: 'Immutable data patterns',
  summary: 'Replace, never mutate: React detects change by reference; in-place mutation = stale UI.',
  tags: ['Immutability', 'React', 'State'],
  doc,
  Demo,
  Exercise,
};
