import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const suspenseLazy: ConceptModule = {
  slug: 'suspense-lazy',
  title: 'Lazy Loading & Suspense',
  summary: 'React.lazy + <Suspense> for on-demand chunks (and data/streaming); boundary placement, error boundaries, transitions, and preloading.',
  tags: ['Pattern', 'Performance', 'Code-splitting'],
  doc,
  Demo,
  Exercise,
};
