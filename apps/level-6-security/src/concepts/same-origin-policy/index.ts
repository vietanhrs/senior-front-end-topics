import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const sameOriginPolicy: ConceptModule = {
  slug: 'same-origin-policy',
  title: 'Same-origin policy nuances',
  summary: 'Origin = (scheme, host, port); SOP blocks reading cross-origin responses/DOM, not sending requests.',
  tags: ['Security', 'Browser', 'Isolation'],
  doc,
  Demo,
  Exercise,
};
