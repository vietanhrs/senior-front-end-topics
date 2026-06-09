import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const criticalRenderingPath: ConceptModule = {
  slug: 'critical-rendering-path',
  title: 'Critical rendering path',
  summary: 'DOM+CSSOM→Render Tree→Layout→Paint. CSS render-blocking, JS parser-blocking.',
  tags: ['Browser', 'Performance', 'Loading'],
  doc,
  Demo,
  Exercise,
};
