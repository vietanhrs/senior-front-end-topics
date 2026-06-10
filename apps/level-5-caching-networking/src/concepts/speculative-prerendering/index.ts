import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const speculativePrerendering: ConceptModule = {
  slug: 'speculative-prerendering',
  title: 'Speculative prerendering',
  summary: 'Speculation Rules: prefetch/prerender likely next pages on hover; gate analytics & side effects.',
  tags: ['Navigation', 'Performance', 'UX'],
  doc,
  Demo,
  Exercise,
};
