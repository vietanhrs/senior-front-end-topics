import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const interactionToNextPaint: ConceptModule = {
  slug: 'interaction-to-next-paint',
  title: 'Interaction to Next Paint (INP)',
  summary: 'The responsiveness Core Web Vital: full interaction latency (input delay + processing + presentation) to the next paint.',
  tags: ['Web Vitals', 'Performance', 'Metrics'],
  doc,
  Demo,
  Exercise,
};
