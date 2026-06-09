import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const eventLoop: ConceptModule = {
  slug: 'event-loop',
  title: 'Event loop (macro vs microtasks)',
  summary: 'Sync → drain microtasks → render → one macrotask. await is a microtask.',
  tags: ['Runtime', 'Async', 'Performance'],
  doc,
  Demo,
  Exercise,
};
