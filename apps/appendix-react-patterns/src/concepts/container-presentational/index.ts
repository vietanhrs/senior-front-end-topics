import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const containerPresentational: ConceptModule = {
  slug: 'container-presentational',
  title: 'Container / Presentational',
  summary: 'Separate pure prop-driven view components from data/logic — today the "container" is usually a custom hook.',
  tags: ['Pattern', 'Composition', 'Separation'],
  doc,
  Demo,
  Exercise,
};
