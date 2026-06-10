import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const subpixelRendering: ConceptModule = {
  slug: 'subpixel-rendering',
  title: 'Subpixel rendering',
  summary: 'CSS px vs device px (DPR); fractional offsets blur via anti-aliasing — snap to the device grid.',
  tags: ['Rendering', 'HiDPI', 'Polish'],
  doc,
  Demo,
  Exercise,
};
