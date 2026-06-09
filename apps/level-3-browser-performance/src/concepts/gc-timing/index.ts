import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const gcTiming: ConceptModule = {
  slug: 'gc-timing',
  title: 'Garbage collection timing',
  summary: 'Non-deterministic GC pauses the thread; allocation pressure in hot paths drops frames.',
  tags: ['Memory', 'GC', 'Performance'],
  doc,
  Demo,
  Exercise,
};
