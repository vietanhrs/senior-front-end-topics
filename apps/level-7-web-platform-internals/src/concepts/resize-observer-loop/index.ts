import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const resizeObserverLoop: ConceptModule = {
  slug: 'resize-observer-loop',
  title: 'ResizeObserver loop limits',
  summary: 'Why "loop completed with undelivered notifications" fires, the one-pass-per-frame bound, and rAF-deferred fixes.',
  tags: ['Observers', 'Performance', 'Layout'],
  doc,
  Demo,
  Exercise,
};
