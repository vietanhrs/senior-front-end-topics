import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const fiber: ConceptModule = {
  slug: 'fiber',
  title: 'Fiber architecture',
  summary: 'Interruptible units of work; pure render phase vs atomic commit; double buffering & lanes.',
  tags: ['React', 'Internals', 'Rendering'],
  doc,
  Demo,
  Exercise,
};
