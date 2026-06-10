import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const backpressure: ConceptModule = {
  slug: 'backpressure',
  title: 'Backpressure in Streams API',
  summary: 'Consumer-paced production via desiredSize/HWM; pull() + pipeTo propagate it automatically.',
  tags: ['Streams', 'Memory', 'Network'],
  doc,
  Demo,
  Exercise,
};
