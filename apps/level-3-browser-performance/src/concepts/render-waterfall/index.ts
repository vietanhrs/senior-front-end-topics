import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const renderWaterfall: ConceptModule = {
  slug: 'render-waterfall',
  title: 'Render waterfall',
  summary: 'Critical-path latency is the sum of the request chain; attack depth & late discovery.',
  tags: ['Network', 'Loading', 'Performance'],
  doc,
  Demo,
  Exercise,
};
