import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const deterministicRendering: ConceptModule = {
  slug: 'deterministic-rendering',
  title: 'Deterministic rendering',
  summary: 'Same inputs → same output: no random/now/global reads or unstable sorts in render.',
  tags: ['Purity', 'SSR', 'Rendering'],
  doc,
  Demo,
  Exercise,
};
