import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const islandArchitecture: ConceptModule = {
  slug: 'island-architecture',
  title: 'Island architecture',
  summary: 'Static HTML + independently-hydrated interactive islands (many small roots, not one app).',
  tags: ['Rendering', 'Hydration', 'Architecture'],
  doc,
  Demo,
  Exercise,
};
