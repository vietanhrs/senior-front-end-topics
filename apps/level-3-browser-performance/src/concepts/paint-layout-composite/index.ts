import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const paintLayoutComposite: ConceptModule = {
  slug: 'paint-layout-composite',
  title: 'Paint vs Layout vs Composite',
  summary: 'The pixel pipeline & which CSS props re-enter it where; transform/opacity = composite-only.',
  tags: ['Rendering', 'Animation', 'Performance'],
  doc,
  Demo,
  Exercise,
};
