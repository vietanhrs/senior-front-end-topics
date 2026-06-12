import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const customHooks: ConceptModule = {
  slug: 'custom-hooks',
  title: 'Custom Hooks',
  summary: 'Extract reusable stateful logic; shared logic with independent per-call state — the modern replacement for HOC/render props.',
  tags: ['Pattern', 'Hooks', 'Reuse'],
  doc,
  Demo,
  Exercise,
};
