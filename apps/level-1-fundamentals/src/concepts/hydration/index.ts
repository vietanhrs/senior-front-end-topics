import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const hydration: ConceptModule = {
  slug: 'hydration',
  title: 'Hydration',
  summary: 'Attach event handlers & state onto server-rendered HTML without repainting the DOM.',
  tags: ['SSR', 'React', 'TTI'],
  doc,
  Demo,
  Exercise,
};
