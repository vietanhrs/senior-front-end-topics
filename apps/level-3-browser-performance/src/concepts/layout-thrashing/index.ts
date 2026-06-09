import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const layoutThrashing: ConceptModule = {
  slug: 'layout-thrashing',
  title: 'Layout thrashing',
  summary: 'Interleaved DOM reads/writes force repeated synchronous reflows; batch reads then writes.',
  tags: ['Layout', 'Reflow', 'Performance'],
  doc,
  Demo,
  Exercise,
};
