import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const pointerEventsModel: ConceptModule = {
  slug: 'pointer-events-model',
  title: 'Pointer events model',
  summary: 'Unified mouse/touch/pen input: pointerType, pointer capture for drags, coalesced events, touch-action, and pointercancel.',
  tags: ['Input', 'Events', 'DOM'],
  doc,
  Demo,
  Exercise,
};
