import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const offscreenCanvas: ConceptModule = {
  slug: 'offscreen-canvas',
  title: 'OffscreenCanvas',
  summary: 'Move the canvas render loop off the main thread: transferControlToOffscreen + worker rAF, transfer not copy.',
  tags: ['Workers', 'Rendering', 'Performance'],
  doc,
  Demo,
  Exercise,
};
