import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const raceConditions: ConceptModule = {
  slug: 'race-conditions',
  title: 'Race conditions in UI state',
  summary: 'Out-of-order async responses let stale data win; guard with cleanup flags, AbortController, or tokens.',
  tags: ['Async', 'State', 'Bugs'],
  doc,
  Demo,
  Exercise,
};
