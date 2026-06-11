import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const cumulativeLayoutShift: ConceptModule = {
  slug: 'cumulative-layout-shift',
  title: 'Cumulative Layout Shift (CLS)',
  summary: 'Visual stability: impact × distance scores in session windows, the hadRecentInput exclusion, and reserving space.',
  tags: ['Web Vitals', 'Performance', 'Layout'],
  doc,
  Demo,
  Exercise,
};
