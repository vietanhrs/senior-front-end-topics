import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const ariaLiveRegions: ConceptModule = {
  slug: 'aria-live-regions',
  title: 'ARIA live regions internals',
  summary: 'Announce dynamic changes without moving focus: polite vs assertive, role=status/alert, atomic/relevant/busy, and the register-first rule.',
  tags: ['Accessibility', 'ARIA', 'Dynamic UI'],
  doc,
  Demo,
  Exercise,
};
