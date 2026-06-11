import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const streamingSsr: ConceptModule = {
  slug: 'streaming-ssr',
  title: 'Streaming SSR',
  summary: 'Flush the shell + Suspense fallbacks first, stream each boundary as it resolves (out of order).',
  tags: ['SSR', 'Streaming', 'Performance'],
  doc,
  Demo,
  Exercise,
};
