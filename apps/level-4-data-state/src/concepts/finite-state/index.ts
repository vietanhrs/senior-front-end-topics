import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const finiteState: ConceptModule = {
  slug: 'finite-state',
  title: 'Finite state modeling',
  summary: 'Replace boolean soup with a discriminated-union FSM; make illegal states unrepresentable.',
  tags: ['State', 'Modeling', 'Reliability'],
  doc,
  Demo,
  Exercise,
};
