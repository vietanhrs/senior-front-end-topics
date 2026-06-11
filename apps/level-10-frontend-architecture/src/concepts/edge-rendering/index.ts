import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const edgeRendering: ConceptModule = {
  slug: 'edge-rendering',
  title: 'Edge rendering',
  summary: 'SSR/middleware on isolates at POPs near users for low TTFB — and the data-gravity trap that decides whether it actually helps.',
  tags: ['Architecture', 'Edge', 'SSR'],
  doc,
  Demo,
  Exercise,
};
