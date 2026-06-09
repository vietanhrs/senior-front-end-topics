import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const staleClosures: ConceptModule = {
  slug: 'stale-closures',
  title: 'Stale closure problems',
  summary: 'Callbacks capture the render they were born in; fix with functional updaters, deps, or refs.',
  tags: ['React', 'Hooks', 'Bugs'],
  doc,
  Demo,
  Exercise,
};
