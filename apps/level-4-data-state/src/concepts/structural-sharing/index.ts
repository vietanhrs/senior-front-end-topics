import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const structuralSharing: ConceptModule = {
  slug: 'structural-sharing',
  title: 'Structural sharing',
  summary: 'Immutable updates that re-create only the change path and share untouched subtrees by reference.',
  tags: ['Immutability', 'State', 'Performance'],
  doc,
  Demo,
  Exercise,
};
