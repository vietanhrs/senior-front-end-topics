import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const abortController: ConceptModule = {
  slug: 'abort-controller',
  title: 'AbortController',
  summary: 'The web cancellation primitive: abort fetches on the wire, timeouts, combined signals.',
  tags: ['Async', 'Network', 'Cancellation'],
  doc,
  Demo,
  Exercise,
};
