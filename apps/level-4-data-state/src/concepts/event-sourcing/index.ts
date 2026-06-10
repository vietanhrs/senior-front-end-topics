import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const eventSourcing: ConceptModule = {
  slug: 'event-sourcing',
  title: 'Event sourcing in frontend',
  summary: 'State = fold over an append-only event log; undo/redo & time-travel fall out for free.',
  tags: ['State', 'History', 'Architecture'],
  doc,
  Demo,
  Exercise,
};
