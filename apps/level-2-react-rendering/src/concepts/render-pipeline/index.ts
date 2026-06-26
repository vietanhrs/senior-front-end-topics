import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const renderPipeline: ConceptModule = {
  slug: 'render-pipeline',
  title: 'Render pipeline & Fiber work loop',
  summary: 'From root update to beginWork, completeWork, effect flags, and commit sub-phases.',
  tags: ['React', 'Fiber', 'Internals'],
  doc,
  Demo,
  Exercise,
};
