import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const cssContainment: ConceptModule = {
  slug: 'css-containment',
  title: 'CSS containment',
  summary: 'Scope layout/paint to a subtree (contain) and skip offscreen rendering (content-visibility).',
  tags: ['Layout', 'Rendering', 'Performance'],
  doc,
  Demo,
  Exercise,
};
