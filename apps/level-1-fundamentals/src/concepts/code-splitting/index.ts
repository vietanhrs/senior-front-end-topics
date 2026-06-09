import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const codeSplitting: ConceptModule = {
  slug: 'code-splitting',
  title: 'Code splitting strategies',
  summary: 'Split the bundle by route/component/vendor; lazy + Suspense + Error Boundary.',
  tags: ['Bundling', 'Performance', 'React'],
  doc,
  Demo,
  Exercise,
};
