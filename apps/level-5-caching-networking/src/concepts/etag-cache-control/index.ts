import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const etagCacheControl: ConceptModule = {
  slug: 'etag-cache-control',
  title: 'ETag vs Cache-Control',
  summary: 'Cache-Control = how long to skip the network; ETag = revalidate cheaply with 304s.',
  tags: ['HTTP', 'Caching', 'Headers'],
  doc,
  Demo,
  Exercise,
};
