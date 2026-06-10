import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const referentialEquality: ConceptModule = {
  slug: 'referential-equality',
  title: 'Referential equality',
  summary: 'Objects/functions compare by reference; fresh identities each render defeat memo & deps.',
  tags: ['React', 'Memoization', 'Identity'],
  doc,
  Demo,
  Exercise,
};
