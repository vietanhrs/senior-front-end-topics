import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const resourceHints: ConceptModule = {
  slug: 'resource-hints',
  title: 'Preload vs Prefetch vs Preconnect',
  summary: 'preconnect = connection; preload = current-page resource (high priority); prefetch = next page.',
  tags: ['Loading', 'Performance', 'Network'],
  doc,
  Demo,
  Exercise,
};
