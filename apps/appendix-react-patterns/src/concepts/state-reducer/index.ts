import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const stateReducer: ConceptModule = {
  slug: 'state-reducer',
  title: 'State Reducer Pattern',
  summary: 'Inversion of control over state: the consumer passes a stateReducer that can veto/modify every transition — one hook replaces a pile of behavior props.',
  tags: ['Pattern', 'State', 'Inversion of control'],
  doc,
  Demo,
  Exercise,
};
