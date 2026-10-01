import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const longAnimationFrames: ConceptModule = {
  slug: 'long-animation-frames',
  title: 'Long Animation Frames (LoAF)',
  summary: 'Go beyond long tasks with frame-level blocking and script attribution for real responsiveness debugging.',
  tags: ['Performance', 'Metrics', 'Responsiveness'],
  doc,
  Demo,
  Exercise,
};
