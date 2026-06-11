import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const streamingSsrPipelines: ConceptModule = {
  slug: 'streaming-ssr-pipelines',
  title: 'Streaming SSR pipelines',
  summary: 'renderToReadableStream → transform → compress → response: shell-first flush, out-of-order boundaries, and end-to-end backpressure.',
  tags: ['SSR', 'Streams', 'React'],
  doc,
  Demo,
  Exercise,
};
