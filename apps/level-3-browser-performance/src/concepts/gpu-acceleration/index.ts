import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const gpuAcceleration: ConceptModule = {
  slug: 'gpu-acceleration',
  title: 'GPU acceleration in CSS',
  summary: 'transform/opacity animate on the compositor/GPU — off the main thread, surviving JS jank.',
  tags: ['GPU', 'Animation', 'Compositing'],
  doc,
  Demo,
  Exercise,
};
