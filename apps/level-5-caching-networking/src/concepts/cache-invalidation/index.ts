import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const cacheInvalidation: ConceptModule = {
  slug: 'cache-invalidation',
  title: 'Cache invalidation strategies',
  summary: 'TTL, key-based/immutable, validation, and event-driven invalidation — and when to use each.',
  tags: ['Caching', 'HTTP', 'Architecture'],
  doc,
  Demo,
  Exercise,
};
