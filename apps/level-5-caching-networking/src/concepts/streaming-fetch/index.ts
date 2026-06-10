import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const streamingFetch: ConceptModule = {
  slug: 'streaming-fetch',
  title: 'Streaming fetch response handling',
  summary: 'Consume response.body chunk-by-chunk: stateful decoding, frame buffering, first-content wins.',
  tags: ['Streams', 'Fetch', 'UX'],
  doc,
  Demo,
  Exercise,
};
