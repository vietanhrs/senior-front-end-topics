import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const shadowDom: ConceptModule = {
  slug: 'shadow-dom',
  title: 'Shadow DOM',
  summary: 'Encapsulated DOM + CSS; slots compose; :host/::slotted/::part & custom props cross the boundary.',
  tags: ['Web Components', 'DOM', 'CSS'],
  doc,
  Demo,
  Exercise,
};
