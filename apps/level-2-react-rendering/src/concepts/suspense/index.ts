import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const suspense: ConceptModule = {
  slug: 'suspense',
  title: 'Suspense boundaries',
  summary: 'Declarative waiting: boundaries define fallback units; use() suspends; transitions avoid flashes.',
  tags: ['React', 'Data', 'Rendering'],
  doc,
  Demo,
  Exercise,
};
