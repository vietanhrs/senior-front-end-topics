import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const renderBlocking: ConceptModule = {
  slug: 'render-blocking-resources',
  title: 'Render blocking resources',
  summary: 'Identify CSS/JS that block the first paint and the toolkit (inline/defer/async/media/preload) to unblock.',
  tags: ['Loading', 'CRP', 'Performance'],
  doc,
  Demo,
  Exercise,
};
