import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const largestContentfulPaint: ConceptModule = {
  slug: 'largest-contentful-paint',
  title: 'Largest Contentful Paint (LCP)',
  summary: 'Loading speed: the largest viewport element’s render time, evolving candidates that freeze on input, and the four sub-parts.',
  tags: ['Web Vitals', 'Performance', 'Loading'],
  doc,
  Demo,
  Exercise,
};
