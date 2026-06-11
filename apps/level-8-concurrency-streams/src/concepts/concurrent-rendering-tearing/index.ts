import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const concurrentRenderingTearing: ConceptModule = {
  slug: 'concurrent-rendering-tearing',
  title: 'Concurrent rendering tearing',
  summary: 'How an external store mutating mid-render tears a sliced concurrent render, and why useSyncExternalStore fixes it.',
  tags: ['React', 'Concurrency', 'State'],
  doc,
  Demo,
  Exercise,
};
