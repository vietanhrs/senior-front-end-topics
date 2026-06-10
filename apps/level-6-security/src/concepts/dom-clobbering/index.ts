import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const domClobbering: ConceptModule = {
  slug: 'dom-clobbering',
  title: 'DOM clobbering',
  summary: 'Script-less HTML injection overwrites JS globals via id/name named access; harden lookups + sanitize id/name.',
  tags: ['Security', 'DOM', 'Injection'],
  doc,
  Demo,
  Exercise,
};
