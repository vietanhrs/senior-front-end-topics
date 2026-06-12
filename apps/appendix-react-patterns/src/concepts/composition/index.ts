import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const compositionPattern: ConceptModule = {
  slug: 'composition',
  title: 'Composition over Configuration',
  summary: 'children + slot props + specialization-by-wrapping replace prop-soup and (nonexistent) inheritance.',
  tags: ['Pattern', 'Composition', 'API design'],
  doc,
  Demo,
  Exercise,
};
