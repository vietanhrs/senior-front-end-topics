import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const accessibilityTree: ConceptModule = {
  slug: 'accessibility-tree',
  title: 'Accessibility tree',
  summary: 'The role + name + state tree assistive tech consumes: implicit vs explicit roles, accname priority, and pruning.',
  tags: ['Accessibility', 'DOM', 'Semantics'],
  doc,
  Demo,
  Exercise,
};
