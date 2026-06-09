import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const compositingLayers: ConceptModule = {
  slug: 'compositing-layers',
  title: 'Browser compositing layers',
  summary: 'Independently rasterized GPU textures; what promotes a layer and the memory cost of overdoing it.',
  tags: ['Compositing', 'GPU', 'Performance'],
  doc,
  Demo,
  Exercise,
};
