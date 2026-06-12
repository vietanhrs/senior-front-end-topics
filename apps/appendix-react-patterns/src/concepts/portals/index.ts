import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const portalsPattern: ConceptModule = {
  slug: 'portals',
  title: 'Portals',
  summary: 'Render into a different DOM node (body) to escape overflow/z-index, while staying in the React tree — events still bubble through React.',
  tags: ['Pattern', 'Overlays', 'DOM'],
  doc,
  Demo,
  Exercise,
};
