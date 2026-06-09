import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const timeSlicing: ConceptModule = {
  slug: 'time-slicing',
  title: 'Time slicing',
  summary: 'Render large updates in ~5ms chunks across frames, yielding to the browser between slices.',
  tags: ['React', 'Concurrency', 'Performance'],
  doc,
  Demo,
  Exercise,
};
